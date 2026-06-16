import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  isObservabilityDebugEnabled,
  isObservabilityEnabled,
  resolveObservabilitySampleRate,
  shouldLoadWebAnalyticsScripts,
} from "@/lib/observability/env";

describe("observability env", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe("isObservabilityEnabled", () => {
    it("defaults to enabled", () => {
      expect(isObservabilityEnabled()).toBe(true);
    });

    it("accepts enabled values", () => {
      vi.stubEnv("NEXT_PUBLIC_OBSERVABILITY_ENABLED", "1");
      expect(isObservabilityEnabled()).toBe(true);

      vi.stubEnv("NEXT_PUBLIC_OBSERVABILITY_ENABLED", "true");
      expect(isObservabilityEnabled()).toBe(true);
    });

    it("accepts disabled values", () => {
      vi.stubEnv("NEXT_PUBLIC_OBSERVABILITY_ENABLED", "0");
      expect(isObservabilityEnabled()).toBe(false);

      vi.stubEnv("NEXT_PUBLIC_OBSERVABILITY_ENABLED", "false");
      expect(isObservabilityEnabled()).toBe(false);
    });
  });

  describe("isObservabilityDebugEnabled", () => {
    it("defaults to disabled", () => {
      expect(isObservabilityDebugEnabled()).toBe(false);
    });

    it("accepts enabled values", () => {
      vi.stubEnv("NEXT_PUBLIC_OBSERVABILITY_DEBUG", "1");
      expect(isObservabilityDebugEnabled()).toBe(true);

      vi.stubEnv("NEXT_PUBLIC_OBSERVABILITY_DEBUG", "true");
      expect(isObservabilityDebugEnabled()).toBe(true);
    });

    it("accepts disabled values", () => {
      vi.stubEnv("NEXT_PUBLIC_OBSERVABILITY_DEBUG", "false");
      expect(isObservabilityDebugEnabled()).toBe(false);
    });
  });

  describe("resolveObservabilitySampleRate", () => {
    it("defaults to one", () => {
      expect(resolveObservabilitySampleRate()).toBe(1);
    });

    it("parses valid values", () => {
      vi.stubEnv("NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE", "0.5");
      expect(resolveObservabilitySampleRate()).toBe(0.5);
    });

    it("clamps values below zero", () => {
      vi.stubEnv("NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE", "-1");
      expect(resolveObservabilitySampleRate()).toBe(0);
    });

    it("clamps values above one", () => {
      vi.stubEnv("NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE", "2");
      expect(resolveObservabilitySampleRate()).toBe(1);
    });

    it("falls back for invalid values", () => {
      vi.stubEnv("NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE", "invalid");
      expect(resolveObservabilitySampleRate()).toBe(1);
    });
  });

  describe("shouldLoadWebAnalyticsScripts", () => {
    it("returns false when observability is disabled", () => {
      vi.stubEnv("NEXT_PUBLIC_OBSERVABILITY_ENABLED", "false");
      vi.stubEnv("NODE_ENV", "production");

      expect(shouldLoadWebAnalyticsScripts()).toBe(false);
    });

    it("loads scripts in production", () => {
      vi.stubEnv("NODE_ENV", "production");

      expect(shouldLoadWebAnalyticsScripts()).toBe(true);
    });

    it("loads scripts in development when explicitly enabled", () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("NEXT_PUBLIC_OBSERVABILITY_LOAD_IN_DEV", "1");

      expect(shouldLoadWebAnalyticsScripts()).toBe(true);
    });

    it("does not load scripts in development by default", () => {
      vi.stubEnv("NODE_ENV", "development");

      expect(shouldLoadWebAnalyticsScripts()).toBe(false);
    });
  });
});
