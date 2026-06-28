"use client";

import { ApiService } from "@/lib/services/api-service";

/**
 * Browser client for Gemini Live full-duplex voice.
 *
 * Flow:
 *   1. Ask our backend for a short-lived, constrained ephemeral token
 *      (the managed Gemini key never reaches the browser).
 *   2. Open a WebSocket straight to the Gemini Live API with that token (lowest
 *      latency; audio is not relayed through our server).
 *   3. Capture mic audio as 16 kHz mono PCM16 and stream it up.
 *   4. Play back the 24 kHz PCM16 audio Gemini streams down, and surface input
 *      and output amplitude + a coarse status so the UI waveform can react.
 *
 * This intentionally mirrors the handler shape of the existing
 * AgentRealtimeClient so it can be wired in the same way.
 */

const GEMINI_LIVE_WS_BASE =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent";

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const INPUT_FRAME_SIZE = 2048;

export type GeminiLiveVoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking";

export type GeminiLiveHandlers = {
  onVoiceState?: (state: GeminiLiveVoiceState) => void;
  /** Input (mic) amplitude in [0, 1], sampled continuously while listening. */
  onInputLevel?: (level: number) => void;
  /** Output (agent) amplitude in [0, 1], sampled while audio is playing. */
  onOutputLevel?: (level: number) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
};

type GeminiLiveTokenPayload = {
  token: string;
  model: string;
  voice: string;
  tier: string;
  api_version: string;
};

function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function bytesFromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Float32 [-1,1] -> little-endian PCM16 bytes. */
function floatToPcm16(input: Float32Array): Uint8Array {
  const out = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i] ?? 0));
    out.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return new Uint8Array(out.buffer);
}

/** Downsample a Float32 buffer from sourceRate to INPUT_SAMPLE_RATE. */
function downsample(buffer: Float32Array, sourceRate: number): Float32Array {
  if (sourceRate === INPUT_SAMPLE_RATE) return buffer;
  const ratio = sourceRate / INPUT_SAMPLE_RATE;
  const length = Math.floor(buffer.length / ratio);
  const result = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    result[i] = buffer[Math.floor(i * ratio)] ?? 0;
  }
  return result;
}

function rms(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const v = buffer[i] ?? 0;
    sum += v * v;
  }
  return Math.sqrt(sum / Math.max(1, buffer.length));
}

export class GeminiLiveClient {
  private handlers: GeminiLiveHandlers;
  private ws: WebSocket | null = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private closed = false;
  private setupComplete = false;
  private playheadTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();
  private outputLevelTimer: ReturnType<typeof setInterval> | null = null;
  private state: GeminiLiveVoiceState = "idle";

  constructor(handlers: GeminiLiveHandlers = {}) {
    this.handlers = handlers;
  }

  private setState(next: GeminiLiveVoiceState) {
    if (this.state === next) return;
    this.state = next;
    this.handlers.onVoiceState?.(next);
  }

  async start(options?: { voice?: string | null; signal?: AbortSignal }): Promise<void> {
    if (this.ws) return;
    this.setState("connecting");

    let payload: GeminiLiveTokenPayload;
    try {
      const response = await ApiService.fetchGeminiLiveToken({
        voice: options?.voice ?? null,
        signal: options?.signal,
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(
          (detail as { detail?: string }).detail || "Could not start Gemini Live."
        );
      }
      payload = (await response.json()) as GeminiLiveTokenPayload;
    } catch (error) {
      this.fail(error instanceof Error ? error.message : "Could not start Gemini Live.");
      return;
    }

    try {
      await this.openMicrophone();
    } catch {
      this.fail("Microphone permission is required for voice mode.");
      return;
    }

    if (this.closed) return;
    this.connectSocket(payload);
  }

  private async openMicrophone(): Promise<void> {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.inputContext = new AudioCtx();
    this.sourceNode = this.inputContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.inputContext.createScriptProcessor(INPUT_FRAME_SIZE, 1, 1);
    this.sourceNode.connect(this.processor);
    this.processor.connect(this.inputContext.destination);

    this.processor.onaudioprocess = (event) => {
      if (!this.setupComplete || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }
      const channel = event.inputBuffer.getChannelData(0);
      const level = Math.min(1, rms(channel) * 4);
      this.handlers.onInputLevel?.(level);
      if (this.state !== "speaking") this.setState("listening");
      const sourceRate = this.inputContext?.sampleRate ?? INPUT_SAMPLE_RATE;
      const pcm = floatToPcm16(downsample(channel, sourceRate));
      this.ws.send(
        JSON.stringify({
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
                data: base64FromBytes(pcm),
              },
            ],
          },
        })
      );
    };
  }

  private connectSocket(payload: GeminiLiveTokenPayload): void {
    const url = `${GEMINI_LIVE_WS_BASE}?access_token=${encodeURIComponent(payload.token)}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          setup: {
            model: payload.model.startsWith("models/")
              ? payload.model
              : `models/${payload.model}`,
            generationConfig: { responseModalities: ["AUDIO"] },
          },
        })
      );
    };

    ws.onmessage = (event) => {
      void this.handleSocketMessage(event.data);
    };

    ws.onerror = () => {
      if (!this.closed) this.fail("Gemini Live connection error.");
    };

    ws.onclose = () => {
      if (!this.closed) this.stop();
    };
  }

  private async handleSocketMessage(data: unknown): Promise<void> {
    let text: string;
    if (typeof data === "string") {
      text = data;
    } else if (data instanceof Blob) {
      text = await data.text();
    } else {
      return;
    }

    let message: Record<string, unknown>;
    try {
      message = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return;
    }

    if ("setupComplete" in message) {
      this.setupComplete = true;
      this.setState("listening");
      return;
    }

    const serverContent = message.serverContent as
      | { modelTurn?: { parts?: Array<Record<string, unknown>> }; interrupted?: boolean }
      | undefined;
    if (!serverContent) return;

    if (serverContent.interrupted) {
      this.stopPlayback();
      this.setState("listening");
      return;
    }

    const parts = serverContent.modelTurn?.parts ?? [];
    for (const part of parts) {
      const inlineData = part.inlineData as
        | { mimeType?: string; data?: string }
        | undefined;
      if (inlineData?.data && (inlineData.mimeType ?? "").startsWith("audio/")) {
        this.enqueueAudio(bytesFromBase64(inlineData.data));
      }
    }
  }

  private ensureOutputContext(): AudioContext {
    if (!this.outputContext) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.outputContext = new AudioCtx({ sampleRate: OUTPUT_SAMPLE_RATE });
      this.playheadTime = this.outputContext.currentTime;
      this.startOutputLevelMeter();
    }
    return this.outputContext;
  }

  private enqueueAudio(pcmBytes: Uint8Array): void {
    const context = this.ensureOutputContext();
    const frames = pcmBytes.length / 2;
    if (frames <= 0) return;
    const view = new DataView(
      pcmBytes.buffer,
      pcmBytes.byteOffset,
      pcmBytes.byteLength
    );
    const buffer = context.createBuffer(1, frames, OUTPUT_SAMPLE_RATE);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      channel[i] = view.getInt16(i * 2, true) / 0x8000;
    }

    const node = context.createBufferSource();
    node.buffer = buffer;
    node.connect(context.destination);
    const startAt = Math.max(context.currentTime, this.playheadTime);
    node.start(startAt);
    this.playheadTime = startAt + buffer.duration;
    this.setState("speaking");
    this.activeSources.add(node);
    node.onended = () => {
      this.activeSources.delete(node);
      if (this.activeSources.size === 0 && !this.closed) {
        this.setState("listening");
        this.handlers.onOutputLevel?.(0);
      }
    };
  }

  private startOutputLevelMeter(): void {
    if (this.outputLevelTimer) return;
    // Approximate the agent waveform with a gentle pulse while audio is queued.
    this.outputLevelTimer = setInterval(() => {
      if (this.activeSources.size === 0) return;
      const t = Date.now() / 1000;
      const level = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 7));
      this.handlers.onOutputLevel?.(Math.min(1, level));
    }, 50);
  }

  private stopPlayback(): void {
    for (const node of this.activeSources) {
      try {
        node.stop();
      } catch {
        // ignore
      }
    }
    this.activeSources.clear();
    if (this.outputContext) this.playheadTime = this.outputContext.currentTime;
    this.handlers.onOutputLevel?.(0);
  }

  private fail(message: string): void {
    this.handlers.onError?.(message);
    this.stop();
  }

  stop(): void {
    if (this.closed) return;
    this.closed = true;
    this.setupComplete = false;

    if (this.outputLevelTimer) {
      clearInterval(this.outputLevelTimer);
      this.outputLevelTimer = null;
    }
    this.stopPlayback();

    if (this.processor) {
      this.processor.onaudioprocess = null;
      try {
        this.processor.disconnect();
      } catch {
        // ignore
      }
      this.processor = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) track.stop();
      this.mediaStream = null;
    }
    if (this.inputContext) {
      void this.inputContext.close().catch(() => undefined);
      this.inputContext = null;
    }
    if (this.outputContext) {
      void this.outputContext.close().catch(() => undefined);
      this.outputContext = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    this.setState("idle");
    this.handlers.onClose?.();
  }
}
