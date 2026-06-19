"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { HushhLoader } from "@/components/app-ui/hushh-loader";
import { NativeRouteMarker } from "@/components/app-ui/native-route-marker";
import { OneDashboardPage } from "@/components/dashboard/one-dashboard-page";
import { useConsentPendingSummaryCount } from "@/lib/consent/use-consent-pending-summary-count";
import { useAuth } from "@/lib/firebase/auth-context";
import { ROUTES } from "@/lib/navigation/routes";

export default function OneHomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const pendingConsents = useConsentPendingSummaryCount();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(ROUTES.ONE_HOME)}`);
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return <HushhLoader label="Opening One..." variant="fullscreen" />;
  }

  return (
    <>
      <NativeRouteMarker
        routeId="/one"
        marker="native-route-one-home"
        authState="authenticated"
        dataState="loaded"
      />
      <OneDashboardPage
        displayName={user.displayName || user.email}
        pendingConsents={pendingConsents}
      />
    </>
  );
}
