import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Navbar } from "@/components/navbar";
import { ROUTES } from "@/lib/navigation/routes";

const navigationMock = vi.hoisted(() => ({
  pathname: "/connected-systems",
  push: vi.fn(),
}));

const personaMock = vi.hoisted(() => ({
  activePersona: "investor" as string | null,
}));

const agentPopoverMock = vi.hoisted(() => ({
  expanded: false,
  openAgent: vi.fn(),
}));

const kaiSessionMock = vi.hoisted(() => {
  const setLastKaiPath = vi.fn();
  const setLastRiaPath = vi.fn();
  const state = {
    busyOperations: {},
    setLastKaiPath,
    setLastRiaPath,
  };
  const useKaiSession = Object.assign(
    vi.fn((selector?: (value: typeof state) => unknown) =>
      typeof selector === "function" ? selector(state) : state,
    ),
    {
      getState: vi.fn(() => state),
    },
  );
  return { useKaiSession, setLastKaiPath, setLastRiaPath };
});

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
  useRouter: () => ({
    push: navigationMock.push,
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

vi.mock("@/lib/vault/vault-context", () => ({
  useVault: () => ({
    isVaultUnlocked: true,
  }),
}));

vi.mock("@/components/agent/agent-popover-provider", () => ({
  useOptionalAgentPopover: () => ({
    expanded: agentPopoverMock.expanded,
    openAgent: agentPopoverMock.openAgent,
  }),
}));

vi.mock("@/lib/persona/persona-context", () => ({
  usePersonaState: () => ({
    activePersona: personaMock.activePersona,
  }),
}));

vi.mock("@/lib/consent/use-consent-pending-summary-count", () => ({
  useConsentPendingSummaryCount: () => 0,
}));

vi.mock("@/lib/navigation/kai-bottom-chrome-visibility", () => ({
  useKaiBottomChromeVisibility: () => ({
    hidden: false,
    progress: 0,
  }),
}));

vi.mock("@/lib/stores/kai-session-store", () => ({
  useKaiSession: kaiSessionMock.useKaiSession,
}));

describe("Navbar bottom navigation", () => {
  beforeEach(() => {
    navigationMock.pathname = ROUTES.CONNECTED_SYSTEMS;
    navigationMock.push.mockReset();
    personaMock.activePersona = "investor";
    kaiSessionMock.setLastKaiPath.mockReset();
    kaiSessionMock.setLastRiaPath.mockReset();
    agentPopoverMock.expanded = false;
    agentPopoverMock.openAgent.mockReset();
  });

  it("shows One, Systems, Profile, and separate Search on generic One routes", () => {
    render(<Navbar />);

    expect(screen.getByRole("radio", { name: "One" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Systems" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Consent" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Search" })).toBeNull();
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Profile" })).toBeTruthy();
  });

  it("shows the root One/Profile switch on the One dashboard", () => {
    navigationMock.pathname = ROUTES.ONE_HOME;

    render(<Navbar />);

    expect(screen.getByRole("radio", { name: "One" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Profile" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Gmail" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Consent" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Market" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Search" })).toBeNull();
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "Profile" }));
    expect(navigationMock.push).toHaveBeenLastCalledWith(ROUTES.PROFILE);
  });

  it("shows the same root switch on Profile without adding route-family tabs", () => {
    navigationMock.pathname = ROUTES.PROFILE;

    render(<Navbar />);

    expect(screen.getByRole("radio", { name: "One" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Profile" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Gmail" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Market" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Search" })).toBeNull();
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
  });

  it("uses market context inside Investor routes", () => {
    navigationMock.pathname = ROUTES.KAI_ANALYSIS;

    render(<Navbar />);

    expect(screen.getByRole("radio", { name: "Market" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Analysis" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "One" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Profile" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Portfolio" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Connect" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "RIA" })).toBeNull();
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
  });

  it("uses advisory context inside RIA routes", () => {
    navigationMock.pathname = ROUTES.RIA_PICKS;
    personaMock.activePersona = "ria";

    render(<Navbar />);

    expect(screen.getByRole("radio", { name: "RIA" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Clients" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "One" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Profile" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Connect" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Picks" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Market" })).toBeNull();
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
  });
});
