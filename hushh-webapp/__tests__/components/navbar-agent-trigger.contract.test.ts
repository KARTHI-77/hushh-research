import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const WEBAPP_ROOT = path.resolve(__dirname, "../..");

function read(relativePath: string) {
  return fs.readFileSync(path.join(WEBAPP_ROOT, relativePath), "utf8");
}

describe("Navbar Agent trigger contract", () => {
  it("keeps the embedded bottom-right Agent entrypoint wired to the popover provider", () => {
    const navbar = read("components/navbar.tsx");
    const provider = read("components/agent/agent-popover-provider.tsx");

    expect(provider).toContain("useOptionalAgentPopover");
    expect(navbar).toContain("useOptionalAgentPopover");
    expect(navbar).toContain('data-testid="bottom-agent-trigger"');
    expect(navbar).toContain('aria-label="Open Agent"');
    expect(navbar).toContain("agentPopover.openAgent()");
    expect(navbar).toContain('style={{ width: "calc(100% - 66px)" }}');
  });
});
