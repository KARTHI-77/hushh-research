import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AgentPopoverProvider,
  useAgentPopover,
} from "@/components/agent/agent-popover-provider";


const navigationMock = vi.hoisted(() => ({
  pathname: "/profile",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

vi.mock("@/components/agent/agent-chat-workspace", () => ({
  AgentChatWorkspace: () => <div data-testid="agent-chat-workspace" />,
}));

vi.mock("@/components/agent/agent-voice-floating-indicator", () => ({
  AgentVoiceFloatingIndicator: () => null,
}));

function makeRect(input: {
  left: number;
  top: number;
  width: number;
  height: number;
}): DOMRect {
  const rect = {
    x: input.left,
    y: input.top,
    left: input.left,
    top: input.top,
    width: input.width,
    height: input.height,
    right: input.left + input.width,
    bottom: input.top + input.height,
    toJSON: () => rect,
  };
  return rect as DOMRect;
}

describe("AgentPopoverProvider floating trigger", () => {
  let getBoundingClientRectSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    navigationMock.pathname = "/login";
    window.localStorage.clear();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 430,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 932,
    });

    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
      configurable: true,
      value: vi.fn(() => true),
    });

    getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function getMockRect(this: HTMLElement) {
        if (this.getAttribute("data-tour-id") === "kai-command-bar") {
          return makeRect({ left: 35, top: 720, width: 360, height: 48 });
        }
        if (this.getAttribute("aria-label") === "Main navigation") {
          return makeRect({ left: 20, top: 812, width: 390, height: 74 });
        }
        if (this.getAttribute("aria-label") === "Open Agent") {
          return makeRect({ left: 366, top: 660, width: 48, height: 44 });
        }
        return makeRect({ left: 0, top: 0, width: 0, height: 0 });
      });
  });

  afterEach(() => {
    getBoundingClientRectSpy.mockRestore();
  });

  it("does not render a stray floating trigger when app chrome owns Agent entrypoints", () => {
    render(
      <div>
        <div data-tour-id="kai-command-bar" />
        <div aria-label="Main navigation" />
        <AgentPopoverProvider>
          <main />
        </AgentPopoverProvider>
      </div>
    );

    expect(screen.queryByRole("button", { name: "Open Agent" })).toBeNull();
  });

  it("does not render a duplicate floating trigger on Kai command-bar routes", () => {
    navigationMock.pathname = "/kai";

    render(
      <div>
        <div data-tour-id="kai-command-bar" />
        <div aria-label="Main navigation" />
        <AgentPopoverProvider>
          <main />
        </AgentPopoverProvider>
      </div>
    );

    expect(screen.queryByRole("button", { name: "Open Agent" })).toBeNull();
  });

  it("does not render a duplicate floating trigger on Profile command-bar routes", () => {
    navigationMock.pathname = "/profile";

    render(
      <div>
        <div data-tour-id="kai-command-bar" />
        <div aria-label="Main navigation" />
        <AgentPopoverProvider>
          <main />
        </AgentPopoverProvider>
      </div>
    );

    expect(screen.queryByRole("button", { name: "Open Agent" })).toBeNull();
  });

  // Regression: the fullscreen agent window must NOT stay mounted on top of the
  // destination page after a route change. Opening the agent on one screen and
  // navigating (e.g. into /one/location) previously left the agent covering the
  // page's real UI. Closing on route change keeps the agent a transient overlay.
  it("minimizes the agent window when the route changes", () => {
    navigationMock.pathname = "/profile";

    // openAgent defers setExpanded to requestAnimationFrame; run rAF callbacks
    // synchronously so the open transition completes within act().
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });

    function OpenAgentOnMount() {
      const { openAgent, expanded } = useAgentPopover();

      return (
        <button
          type="button"
          data-testid="probe"
          data-expanded={expanded ? "1" : "0"}
          onClick={openAgent}
        >
          open
        </button>
      );
    }

    const { rerender } = render(
      <AgentPopoverProvider>
        <OpenAgentOnMount />
      </AgentPopoverProvider>,
    );

    const probe = () => screen.getByTestId("probe");
    expect(probe().getAttribute("data-expanded")).toBe("0");

    // Open the agent on the current route.
    act(() => {
      probe().click();
    });
    expect(probe().getAttribute("data-expanded")).toBe("1");

    // Navigate to a new route; the agent must close itself.
    act(() => {
      navigationMock.pathname = "/one/location";
      rerender(
        <AgentPopoverProvider>
          <OpenAgentOnMount />
        </AgentPopoverProvider>,
      );
    });

    expect(probe().getAttribute("data-expanded")).toBe("0");

    rafSpy.mockRestore();
  });
});


