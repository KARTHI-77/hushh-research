import { beforeEach, describe, expect, it } from "vitest";

import { ROUTES } from "@/lib/navigation/routes";
import {
  ONBOARDING_FLOW_ACTIVE_COOKIE,
  ONBOARDING_REQUIRED_COOKIE,
  getOnboardingRoute,
  isOnboardingFlowActiveCookieEnabled,
  isOnboardingRequiredCookieEnabled,
  isOnboardingRoute,
  setOnboardingFlowActiveCookie,
  setOnboardingRequiredCookie,
} from "@/lib/services/onboarding-route-cookie";

describe("onboarding route cookie utilities", () => {
  beforeEach(() => {
    document.cookie = `${ONBOARDING_REQUIRED_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `${ONBOARDING_FLOW_ACTIVE_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });

  describe("getOnboardingRoute", () => {
    it("returns the preferred onboarding route", () => {
      expect(getOnboardingRoute()).toBe(ROUTES.KAI_ONBOARDING);
    });
  });

  describe("isOnboardingRoute", () => {
    it("recognizes onboarding routes", () => {
      expect(isOnboardingRoute(ROUTES.KAI_ONBOARDING)).toBe(true);
    });

    it("rejects non-onboarding routes", () => {
      expect(isOnboardingRoute(ROUTES.KAI_HOME)).toBe(false);
    });
  });

  describe("required cookie lifecycle", () => {
    it("enables the required cookie", () => {
      setOnboardingRequiredCookie(true);

      expect(isOnboardingRequiredCookieEnabled()).toBe(true);
    });

    it("disables the required cookie", () => {
      setOnboardingRequiredCookie(true);
      setOnboardingRequiredCookie(false);

      expect(isOnboardingRequiredCookieEnabled()).toBe(false);
    });
  });

  describe("flow active cookie lifecycle", () => {
    it("enables the flow active cookie", () => {
      setOnboardingFlowActiveCookie(true);

      expect(isOnboardingFlowActiveCookieEnabled()).toBe(true);
    });

    it("disables the flow active cookie", () => {
      setOnboardingFlowActiveCookie(true);
      setOnboardingFlowActiveCookie(false);

      expect(isOnboardingFlowActiveCookieEnabled()).toBe(false);
    });
  });
});
