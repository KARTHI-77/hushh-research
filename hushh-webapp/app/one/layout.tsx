import type { ReactNode } from "react";

import { PhoneMandateGuard } from "@/components/auth/phone-mandate-guard";
import { OneOnboardingGuard } from "@/components/kai/onboarding/kai-onboarding-guard";
import { VaultLockGuard } from "@/components/vault/vault-lock-guard";

export default function OneLayout({ children }: { children: ReactNode }) {
  // Guard order: authentication/vault -> phone mandate -> root onboarding gate.
  // OneOnboardingGuard hard-gates the whole /one/* surface: a user who has not
  // resolved the root onboarding flow can only reach /one/setup or
  // /one/onboarding (the guard allows those through); everything else redirects
  // to /one/setup until the gate is satisfied.
  return (
    <VaultLockGuard>
      <PhoneMandateGuard>
        <OneOnboardingGuard>{children}</OneOnboardingGuard>
      </PhoneMandateGuard>
    </VaultLockGuard>
  );
}
