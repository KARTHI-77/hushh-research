import { ONE_CAPABILITIES, type OneCapability } from "@/lib/onboarding/one-capabilities";
import { buildOneOnboardingRoute } from "@/lib/navigation/routes";

/**
 * SETUP COPY — One's voice, plain language, for the `/one/setup` hub and the
 * guided per-capability sub-flow.
 *
 * Rules (Phase 9):
 * - No system nouns leak to the person: no "vault", "token", "OAuth", "PKM",
 *   "decrypt". One speaks like a helpful person, not a settings panel.
 * - `setupTitle` is an action-framed heading ("Set up your finances"), distinct
 *   from the catalog `title` ("Finance") used as the short label.
 * - `setupBlurb` explains the *value* of finishing the step in one sentence.
 * - `href` defers to the canonical capability route, except where a dedicated
 *   guided flow already exists (finance → the existing Kai onboarding wizard,
 *   which we must reuse rather than rebuild).
 */
export interface CapabilitySetupCopy {
  id: string;
  /** Short label, reused from the shared catalog. */
  title: string;
  /** Action-framed heading shown in the guided flow. */
  setupTitle: string;
  /** One-sentence, value-first explanation. */
  setupBlurb: string;
  /** Where "Set up" / "Continue" routes for this capability. */
  href: string;
  /**
   * First-visit Explore card copy for explore-only capabilities (those that
   * collect nothing). Present only for explore-only ids. `exploreTitle` is a
   * warm "here's what's in this tab" heading; `exploreBullets` are 2-3 plain
   * one-liners describing what the person can do here, no system nouns.
   */
  exploreTitle?: string;
  exploreBlurb?: string;
  exploreBullets?: readonly string[];
}

const SETUP_COPY_BY_ID: Record<
  string,
  {
    setupTitle: string;
    setupBlurb: string;
    href?: string;
    exploreTitle?: string;
    exploreBlurb?: string;
    exploreBullets?: readonly string[];
  }
> = {
  finance: {
    setupTitle: "Set up your finances",
    setupBlurb:
      "Tell One how you like to invest so it can read your portfolio and surface analysis that fits you.",
    // Reuse the existing finance onboarding wizard — do not rebuild it.
    href: buildOneOnboardingRoute(),
  },
  gmail: {
    setupTitle: "Bring in your receipts",
    setupBlurb:
      "Connect Gmail so One can keep a private memory of your purchases and pull up any receipt in seconds.",
  },
  email: {
    setupTitle: "Let One draft for you",
    setupBlurb:
      "Set up email so One can prepare replies and approvals you can send with a tap.",
    exploreTitle: "Here's your email workspace",
    exploreBlurb:
      "Nothing to set up — take a quick look at what One can do for your inbox.",
    exploreBullets: [
      "One drafts replies and approvals you can send with a tap.",
      "Everything stays a draft until you choose to send it.",
      "Come back any time — you are always in control.",
    ],
  },
  location: {
    setupTitle: "Add live location",
    setupBlurb:
      "Share location when it helps so One can offer local context and referrals — you stay in control.",
    exploreTitle: "Here's how location helps",
    exploreBlurb:
      "Nothing to set up — see what local context unlocks before you share anything.",
    exploreBullets: [
      "Share your location only when it actually helps.",
      "One adds local context and referrals around you.",
      "Turn sharing off whenever you want.",
    ],
  },
  pkm: {
    setupTitle: "Save what matters",
    setupBlurb:
      "Keep notes and personal details in one private place that only you and One can open.",
  },
  consent: {
    setupTitle: "Review who has access",
    setupBlurb:
      "See every request to use your data, approve what you trust, and pull access back any time.",
    exploreTitle: "Here's your access center",
    exploreBlurb:
      "Nothing to set up — this is where you see and control who can use your data.",
    exploreBullets: [
      "Every request to use your data shows up here.",
      "Approve what you trust, decline the rest.",
      "Pull access back at any time, instantly.",
    ],
  },
  "connected-systems": {
    setupTitle: "Link your tools",
    setupBlurb:
      "Connect the systems you already use so One can read and update them with your approval.",
  },
};

function toSetupCopy(cap: OneCapability): CapabilitySetupCopy {
  const extra = SETUP_COPY_BY_ID[cap.id];
  return {
    id: cap.id,
    title: cap.title,
    setupTitle: extra?.setupTitle ?? `Set up ${cap.title}`,
    setupBlurb: extra?.setupBlurb ?? cap.description,
    href: extra?.href ?? cap.href,
    exploreTitle: extra?.exploreTitle,
    exploreBlurb: extra?.exploreBlurb,
    exploreBullets: extra?.exploreBullets,
  };
}

/** Ordered setup copy for every One capability, mirroring the catalog order. */
export const CAPABILITY_SETUP_COPY: readonly CapabilitySetupCopy[] =
  ONE_CAPABILITIES.map(toSetupCopy);

/** Lookup setup copy by capability id. */
export function getCapabilitySetupCopy(id: string): CapabilitySetupCopy | undefined {
  return CAPABILITY_SETUP_COPY.find((c) => c.id === id);
}
