import { describe, expect, it } from "vitest";

import { ROUTES } from "@/lib/navigation/routes";
import {
  hasVerifiedPhoneNumber,
  isPhoneMandatePath,
  maskPhoneNumber,
  shouldBypassPhoneMandateForRoute,
  shouldRequirePhoneMandate,
} from "@/lib/services/phone-mandate-service";

describe("hasVerifiedPhoneNumber", () => {
  it("accepts populated phone numbers", () => {
    expect(hasVerifiedPhoneNumber("+16505550101")).toBe(true);
    expect(hasVerifiedPhoneNumber(" 123 ")).toBe(true);
  });

  it("rejects empty values", () => {
    expect(hasVerifiedPhoneNumber("")).toBe(false);
    expect(hasVerifiedPhoneNumber(null)).toBe(false);
    expect(hasVerifiedPhoneNumber(undefined)).toBe(false);
  });
});

describe("shouldBypassPhoneMandateForRoute", () => {
  it("bypasses ria onboarding", () => {
    expect(
      shouldBypassPhoneMandateForRoute(ROUTES.RIA_ONBOARDING)
    ).toBe(true);
  });

  it("does not bypass other routes", () => {
    expect(
      shouldBypassPhoneMandateForRoute("/kai")
    ).toBe(false);

    expect(
      shouldBypassPhoneMandateForRoute(undefined)
    ).toBe(false);
  });
});

describe("maskPhoneNumber", () => {
  it("preserves the last four digits", () => {
    const masked = maskPhoneNumber("+1 (650) 555-0101");

    expect(masked).toContain("0101");
    expect(masked).not.toContain("6505550101");
  });

  it("returns short values unchanged", () => {
    expect(maskPhoneNumber("1234")).toBe("1234");
  });

  it("returns empty string for empty values", () => {
    expect(maskPhoneNumber("")).toBe("");
    expect(maskPhoneNumber(null)).toBe("");
    expect(maskPhoneNumber(undefined)).toBe("");
  });
});

describe("isPhoneMandatePath", () => {
  it("detects the phone mandate route", () => {
    expect(
      isPhoneMandatePath(ROUTES.PHONE_MANDATE)
    ).toBe(true);
  });

  it("rejects non-phone-mandate routes", () => {
    expect(isPhoneMandatePath("/kai")).toBe(false);
    expect(isPhoneMandatePath(null)).toBe(false);
  });
});

describe("shouldRequirePhoneMandate", () => {
  it("does not require a mandate for verified phones", () => {
    expect(
      shouldRequirePhoneMandate({
        phoneVerified: true,
        hasVault: false,
      })
    ).toBe(false);
  });

  it("does not require a mandate when a phone number exists", () => {
    expect(
      shouldRequirePhoneMandate({
        phoneNumber: "+16505550101",
        hasVault: false,
      })
    ).toBe(false);
  });

  it("does not require a mandate on ria onboarding", () => {
    expect(
      shouldRequirePhoneMandate({
        pathname: ROUTES.RIA_ONBOARDING,
        hasVault: false,
      })
    ).toBe(false);
  });

  it("does not require a mandate for exempt vault users", () => {
    expect(
      shouldRequirePhoneMandate({
        hasVault: true,
        exemptVaultUsers: true,
      })
    ).toBe(false);
  });

  it("requires a mandate when no bypass conditions apply", () => {
    expect(
      shouldRequirePhoneMandate({
        hasVault: false,
      })
    ).toBe(true);
  });
});
