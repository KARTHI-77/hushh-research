import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const WEBAPP_ROOT = path.resolve(__dirname, "../..");

function read(relativePath: string) {
  return fs.readFileSync(path.join(WEBAPP_ROOT, relativePath), "utf8");
}

describe("Navbar bottom chrome contract", () => {
  it("keeps Agent owned by search chrome instead of duplicating it beside the nav", () => {
    const navbar = read("components/navbar.tsx");
    const searchBar = read("components/kai/kai-search-bar.tsx");

    expect(navbar).toContain("useOptionalAgentPopover");
    expect(navbar).toContain("function resolveBottomNavMaxWidth");
    expect(navbar).toContain("const bottomNavWidth =");
    expect(navbar).toContain("style={{ width: bottomNavWidth }}");
    expect(navbar).toContain("openKaiCommandBar()");
    expect(navbar).not.toContain('data-testid="bottom-agent-trigger"');
    expect(searchBar).toContain("kai-bottom-agent-action");
    expect(searchBar).toContain('aria-label="Open Agent"');
    expect(searchBar).toContain("&quot;Hello One&quot;");
    expect(searchBar).toContain('agentPopover.motionState !== "idle"');
    expect(searchBar).toContain("max(var(--app-bottom-fixed-ui, 0px), 72px)");
    expect(searchBar).toContain("max(var(--app-bottom-route-group-width, 0px), 14rem)");
    expect(searchBar).not.toContain('data-testid="kai-compact-search-surface"');
    expect(searchBar).not.toContain("Open Kai command search");
    expect(searchBar).toContain("agentPopover.openAgent()");
  });
});
