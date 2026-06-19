import Link from "next/link";
import {
  ChartNoAxesCombined,
  ChevronRight,
  Database,
  FolderSearch,
  LayoutDashboard,
  Mail,
  MailCheck,
  MapPin,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import {
  AppPageContentRegion,
  AppPageHeaderRegion,
  AppPageShell,
} from "@/components/app-ui/app-page-shell";
import { PageHeader } from "@/components/app-ui/page-sections";
import { SurfaceStack } from "@/components/app-ui/surfaces";
import { Badge } from "@/components/ui/badge";
import { buildConsentCenterHref } from "@/lib/consent/consent-sheet-route";
import { ROUTES } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";

type OneDashboardMode = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: string;
  tone:
    | "finance"
    | "gmail"
    | "email"
    | "location"
    | "pkm"
    | "consent"
    | "connected";
  group: "primary" | "workspace" | "trust";
};

const MODE_TILE_CLASS =
  "group relative isolate flex min-h-[7.25rem] flex-col overflow-hidden rounded-lg border border-border/65 bg-card/78 p-3 text-left shadow-sm transition-[background-color,border-color,box-shadow] duration-200 hover:border-foreground/20 hover:bg-card hover:shadow-[0_16px_36px_-28px_rgba(15,23,42,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[8rem] sm:p-4";

const MODE_ICON_CLASS_BY_TONE: Record<OneDashboardMode["tone"], string> = {
  finance: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  gmail: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  email: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  location: "bg-teal-500/12 text-teal-700 dark:text-teal-300",
  pkm: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  consent: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  connected: "bg-cyan-500/12 text-cyan-700 dark:text-cyan-300",
};

const MODE_ACCENT_LINE_BY_TONE: Record<OneDashboardMode["tone"], string> = {
  finance: "bg-emerald-500/70",
  gmail: "bg-rose-500/70",
  email: "bg-sky-500/70",
  location: "bg-teal-500/70",
  pkm: "bg-amber-500/70",
  consent: "bg-violet-500/70",
  connected: "bg-cyan-500/70",
};

function buildModes(pendingConsents: number): OneDashboardMode[] {
  return [
    {
      id: "finance",
      title: "Finance",
      description: "Kai market, portfolio, analysis, and RIA handoff.",
      href: ROUTES.KAI_HOME,
      icon: ChartNoAxesCombined,
      status: "Primary",
      tone: "finance",
      group: "primary",
    },
    {
      id: "gmail",
      title: "Gmail",
      description: "Receipt sync and purchase-memory review.",
      href: ROUTES.GMAIL,
      icon: Mail,
      status: "Receipts",
      tone: "gmail",
      group: "workspace",
    },
    {
      id: "email",
      title: "Email",
      description: "Approval drafts and client request workflows.",
      href: ROUTES.ONE_KYC,
      icon: MailCheck,
      status: "Requests",
      tone: "email",
      group: "workspace",
    },
    {
      id: "location",
      title: "Location",
      description: "Live sharing, referrals, and local context.",
      href: ROUTES.ONE_LOCATION,
      icon: MapPin,
      status: "Private",
      tone: "location",
      group: "workspace",
    },
    {
      id: "pkm",
      title: "Personal Data",
      description: "Saved profile intelligence and sharing controls.",
      href: ROUTES.PKM,
      icon: FolderSearch,
      status: "Vault",
      tone: "pkm",
      group: "workspace",
    },
    {
      id: "consent",
      title: "Consent Guardian",
      description: "Access requests, approvals, and revocations.",
      href: buildConsentCenterHref("pending"),
      icon: ShieldCheck,
      status: pendingConsents > 0 ? `${pendingConsents} pending` : "Clear",
      tone: "consent",
      group: "trust",
    },
    {
      id: "connected-systems",
      title: "Connected Systems",
      description: "Salesforce CRM demo CRUD with approved MCP writes.",
      href: ROUTES.CONNECTED_SYSTEMS,
      icon: Database,
      status: "Salesforce CRM",
      tone: "connected",
      group: "trust",
    },
  ];
}

function ModeTile({
  mode,
  className,
}: {
  mode: OneDashboardMode;
  className?: string;
}) {
  const Icon = mode.icon;
  return (
    <Link
      href={mode.href}
      aria-label={`Open ${mode.title}`}
      className={cn(MODE_TILE_CLASS, className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-3 top-0 h-px rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          MODE_ACCENT_LINE_BY_TONE[mode.tone],
        )}
      />
      <span className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10",
            MODE_ICON_CLASS_BY_TONE[mode.tone],
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
        </span>
        <span className="flex min-w-0 items-center gap-1">
          <Badge
            variant="secondary"
            className="max-w-[6.75rem] truncate text-[10px] sm:max-w-[9rem] sm:text-xs"
          >
            {mode.status}
          </Badge>
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:h-4 sm:w-4"
            aria-hidden
          />
        </span>
      </span>
      <span className="mt-3 block min-w-0 sm:mt-4">
        <span className="block text-[15px] font-semibold leading-5 text-foreground sm:text-lg sm:leading-6">
          {mode.title}
        </span>
        <span className="mt-1.5 hidden text-sm leading-6 text-muted-foreground sm:block">
          {mode.description}
        </span>
      </span>
    </Link>
  );
}

export function OneDashboardPage({
  displayName,
  pendingConsents = 0,
}: {
  displayName?: string | null;
  pendingConsents?: number;
}) {
  const firstName =
    String(displayName || "")
      .trim()
      .split(/\s+/)[0] || "there";
  const modes = buildModes(pendingConsents);
  const primaryMode = modes.find((mode) => mode.group === "primary");
  const workspaceModes = modes.filter((mode) => mode.group === "workspace");
  const trustModes = modes.filter((mode) => mode.group === "trust");

  return (
    <AppPageShell
      as="main"
      width="standard"
      className="relative isolate pb-[calc(var(--app-bottom-fixed-ui,96px)+1.25rem)] sm:pb-10 md:pb-8"
      nativeTest={{
        routeId: "/one",
        marker: "native-route-one-home",
        authState: "authenticated",
        dataState: "loaded",
      }}
    >
      <AppPageHeaderRegion>
        <PageHeader
          eyebrow="One dashboard"
          title={`Good to see you, ${firstName}.`}
          description="Pick the mode you need now. Finance stays first; every other agent opens in its own focused workspace."
          icon={LayoutDashboard}
          accent="neutral"
          actions={
            <Badge variant="secondary" className="w-fit">
              {pendingConsents > 0
                ? `${pendingConsents} consent${pendingConsents === 1 ? "" : "s"} pending`
                : "No pending consents"}
            </Badge>
          }
          actionsInlineMobile
        />
      </AppPageHeaderRegion>

      <AppPageContentRegion>
        <SurfaceStack compact className="gap-4">
          {primaryMode ? (
            <section aria-label="Primary One mode">
              <ModeTile
                mode={primaryMode}
                className="min-h-[6.75rem] sm:min-h-[7.25rem]"
              />
            </section>
          ) : null}

          <section aria-label="One workspaces" className="space-y-2">
            <div className="px-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Workspaces
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
              {workspaceModes.map((mode) => (
                <ModeTile key={mode.id} mode={mode} />
              ))}
            </div>
          </section>

          <section aria-label="Trust and systems" className="space-y-2">
            <div className="px-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Trust & systems
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              {trustModes.map((mode) => (
                <ModeTile key={mode.id} mode={mode} />
              ))}
            </div>
          </section>
        </SurfaceStack>
      </AppPageContentRegion>
    </AppPageShell>
  );
}
