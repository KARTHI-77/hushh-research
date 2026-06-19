import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/navigation/routes";

export default function LegacyKaiOnboardingPage() {
  redirect(ROUTES.KAI_ONBOARDING);
}
