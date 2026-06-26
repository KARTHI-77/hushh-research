"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { PhoneMandateGuard } from "@/components/auth/phone-mandate-guard";
import { VaultLockGuard } from "@/components/vault/vault-lock-guard";
import { isPublicRoute } from "@/lib/navigation/routes";

/**
 * OneAuthGate - conditionally applies the vault + phone login guards to
 * `/one/*` routes.
 *
 * Most One surfaces are private and must stay behind VaultLockGuard +
 * PhoneMandateGuard. However, a small set of One routes are intentionally
 * public - notably shared temporary location links at
 * `/one/location/request/[token]`. Anyone who receives such a link must be
 * able to open it and view the shared live location WITHOUT signing in or
 * having a Hushh account.
 *
 * The source of truth for "which One routes are public" is `isPublicRoute()`
 * in lib/navigation/routes.ts, which the server-side middleware (proxy.ts)
 * already honors. This gate mirrors that contract on the client so the layout
 * does not redirect anonymous visitors of public links to /login.
 */
export function OneAuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isPublicRoute(pathname ?? "")) {
    return <>{children}</>;
  }

  return (
    <VaultLockGuard>
      <PhoneMandateGuard>{children}</PhoneMandateGuard>
    </VaultLockGuard>
  );
}
