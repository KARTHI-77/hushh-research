import { normalizeConsentResponse } from "@/src/lib/consent/normalizeConsent";

// Shorthand for the closed fallback state asserted in integrity-guard tests.
const DENY = { isGranted: false, permissions: [] as string[] };

describe("normalizeConsentResponse", () => {
  it("treats active and granted flags as granted", () => {
    expect(normalizeConsentResponse({ active: true }).isGranted).toBe(true);
    expect(normalizeConsentResponse({ granted: true }).isGranted).toBe(true);
  });

  it("normalizes approved and active statuses as granted", () => {
    expect(normalizeConsentResponse({ status: "approved" }).isGranted).toBe(true);
    expect(normalizeConsentResponse({ status: "active" }).isGranted).toBe(true);
  });

  it("keeps denied, pending, and malformed responses ungranted", () => {
    expect(normalizeConsentResponse({ status: "denied" }).isGranted).toBe(false);
    expect(normalizeConsentResponse({ status: "pending" }).isGranted).toBe(false);
    expect(normalizeConsentResponse(null).isGranted).toBe(false);
  });

  it("deduplicates valid permission and scope strings", () => {
    expect(
      normalizeConsentResponse({
        permissions: ["profile:read", "profile:read", ""],
        scopes: ["vault:read"],
      }).permissions
    ).toEqual(["profile:read", "vault:read"]);
  });

  // ── Integrity guard proof ──────────────────────────────────────────────────
  // Each case below represents a class of tampered or corrupted payload.
  // The guard must intercept ALL of them before the mapping logic runs and
  // return the closed DENY_STATE — fetch/backend never entered.

  describe("integrity guard — default-deny on tampered or corrupted payloads", () => {
    const call = (v: unknown) => normalizeConsentResponse(v as never);

    it("rejects string-coerced active flag (truthy injection)", () => {
      expect(call({ active: "true" })).toStrictEqual(DENY);
    });

    it("rejects numeric-coerced granted flag (1 is not a boolean)", () => {
      expect(call({ granted: 1 })).toStrictEqual(DENY);
    });

    it("rejects object status (non-string type in status field)", () => {
      expect(call({ status: {} })).toStrictEqual(DENY);
    });

    it("rejects array-as-status (truncation / wrong type)", () => {
      expect(call({ status: ["approved"] })).toStrictEqual(DENY);
    });

    it("rejects stringified permissions blob (not an array)", () => {
      expect(call({ permissions: "profile:read,vault:read" })).toStrictEqual(DENY);
    });

    it("rejects object-wrapped scopes (not an array)", () => {
      expect(call({ scopes: { 0: "vault:read" } })).toStrictEqual(DENY);
    });

    it("rejects array top-level payload (not a plain object)", () => {
      expect(call([{ active: true }])).toStrictEqual(DENY);
    });

    it("rejects prototype-pollution payload (__proto__ own key)", () => {
      // JSON.parse is the safe way to construct an object with __proto__ as an
      // own enumerable key without actually mutating the prototype chain.
      const poisoned = JSON.parse('{"__proto__":{"isGranted":true},"active":true}');
      expect(call(poisoned)).toStrictEqual(DENY);
    });

    it("rejects constructor-poisoning payload (constructor as own key)", () => {
      const poisoned = JSON.parse('{"constructor":{"prototype":{}},"granted":true}');
      expect(call(poisoned)).toStrictEqual(DENY);
    });

    it("passes a well-formed payload through the guard unchanged", () => {
      const result = call({
        active: true,
        granted: true,
        status: "approved",
        permissions: ["profile:read"],
        scopes: ["vault:read"],
      });
      expect(result.isGranted).toBe(true);
      expect(result.permissions).toContain("profile:read");
      expect(result.permissions).toContain("vault:read");
    });

    it("null and undefined still return safe default — existing contract preserved", () => {
      expect(call(null)).toStrictEqual(DENY);
      expect(call(undefined)).toStrictEqual(DENY);
    });
  });
  // ── End integrity guard proof ──────────────────────────────────────────────
});
