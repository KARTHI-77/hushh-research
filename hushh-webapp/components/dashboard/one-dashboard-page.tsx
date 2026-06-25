import Link from "next/link";
import {
  BrainCircuit,
  ChevronRight,
  LayoutDashboard,
  Shield,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import {
  AppPageContentRegion,
  AppPageHeaderRegion,
  AppPageShell,
} from "@/components/app-ui/app-page-shell";
import { PageHeader, SectionHeader } from "@/components/app-ui/page-sections";
import { SurfaceStack } from "@/components/app-ui/surfaces";
import { Badge } from "@/components/ui/badge";
import { ONE_CAPABILITIES } from "@/lib/onboarding/one-capabilities";
import { MaterialRipple } from "@/lib/morphy-ux/material-ripple";
import { cn } from "@/lib/utils";

type OneDashboardMode = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: string;
  setupState: "ready" | "setup" | "attention";
  tone:
    | "finance"
    | "gmail"
    | "email"
    | "location"
    | "pkm"
    | "consent"
    | "connected";
  group: "workflow" | "memory" | "access";
};

const MODE_TILE_CLASS =
  "group relative isolate flex min-h-[5.8rem] flex-col overflow-hidden rounded-lg border bg-card/78 p-3 text-left shadow-sm transition-[background-color,border-color,box-shadow] duration-200 hover:bg-card hover:shadow-[0_14px_32px_-28px_rgba(15,23,42,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[6.15rem]";

const MODE_ICON_CLASS_BY_TONE: Record<OneDashboardMode["tone"], string> = {
  finance: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  gmail: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  email: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  location: "bg-teal-500/12 text-teal-700 dark:text-teal-300",
  pkm: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  consent: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  connected: "bg-cyan-500/12 text-cyan-700 dark:text-cyan-300",
};

const MODE_BORDER_CLASS_BY_TONE: Record<OneDashboardMode["tone"], string> = {
  finance:
    "border-emerald-500/28 hover:border-emerald-500/55 dark:border-emerald-400/24 dark:hover:border-emerald-300/48",
  gmail:
    "border-rose-500/28 hover:border-rose-500/55 dark:border-rose-400/24 dark:hover:border-rose-300/48",
  email:
    "border-sky-500/28 hover:border-sky-500/55 dark:border-sky-400/24 dark:hover:border-sky-300/48",
  location:
    "border-teal-500/28 hover:border-teal-500/55 dark:border-teal-400/24 dark:hover:border-teal-300/48",
  pkm:
    "border-amber-500/32 hover:border-amber-500/58 dark:border-amber-400/26 dark:hover:border-amber-300/50",
  consent:
    "border-violet-500/28 hover:border-violet-500/55 dark:border-violet-400/24 dark:hover:border-violet-300/48",
  connected:
    "border-cyan-500/28 hover:border-cyan-500/55 dark:border-cyan-400/24 dark:hover:border-cyan-300/48",
};

const MODE_STATUS_CLASS_BY_STATE: Record<OneDashboardMode["setupState"], string> =
  {
    ready:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    setup:
      "border-amber-500/22 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    attention:
      "border-violet-500/22 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  };

function resolveOneSetupStatus(
  oneSetupResolved: boolean | null | undefined,
): Pick<OneDashboardMode, "status" | "setupState"> {
  if (oneSetupResolved === true) {
    return { status: "Setup done", setupState: "ready" };
  }
  return { status: "Setup needed", setupState: "setup" };
}

function buildModes(
  pendingConsents: number,
  oneSetupResolved?: boolean | null,
): OneDashboardMode[] {
  const oneSetup = resolveOneSetupStatus(oneSetupResolved);

  // Per-tile runtime status lives here; stable identity (title/desc/href/icon/
  // tone/group) comes from the shared ONE_CAPABILITIES catalog so the dashboard
  // and the pre-auth onboarding preview can never drift.
  const runtimeById: Record<
    string,
    Pick<OneDashboardMode, "status" | "setupState">
  > = {
    finance: { status: oneSetup.status, setupState: oneSetup.setupState },
    gmail: { status: "Setup needed", setupState: "setup" },
    email: { status: "Ready", setupState: "ready" },
    location: { status: "Ready", setupState: "ready" },
    pkm: { status: "Ready", setupState: "ready" },
    consent: {
      status: pendingConsents > 0 ? `${pendingConsents} pending` : "Ready",
      setupState: pendingConsents > 0 ? "attention" : "ready",
    },
    "connected-systems": { status: "Setup needed", setupState: "setup" },
  };

  return ONE_CAPABILITIES.map((cap) => {
    const runtime = runtimeById[cap.id] ?? {
      status: "Ready",
      setupState: "ready" as const,
    };
    return {
      id: cap.id,
      title: cap.title,
      description: cap.description,
      href: cap.href,
      icon: cap.icon,
      status: runtime.status,
      setupState: runtime.setupState,
      tone: cap.tone,
      group: cap.group,
    };
  });
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
      className={cn(
        MODE_TILE_CLASS,
        MODE_BORDER_CLASS_BY_TONE[mode.tone],
        className,
      )}
    >
      <MaterialRipple variant="link" effect="glass" className="rounded-lg" />
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
            className={cn(
              "max-w-[7.75rem] truncate text-[10px] sm:max-w-[9rem] sm:text-xs",
              MODE_STATUS_CLASS_BY_STATE[mode.setupState],
            )}
          >
            {mode.status}
          </Badge>
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:h-4 sm:w-4"
            aria-hidden
          />
        </span>
      </span>
      <span className="mt-2 block min-w-0 sm:mt-2.5">
        <span className="block text-[15px] font-semibold leading-5 text-foreground sm:text-lg sm:leading-6">
          {mode.title}
        </span>
        <span className="mt-1 hidden text-sm leading-5 text-muted-foreground sm:line-clamp-1 sm:block md:line-clamp-2">
          {mode.description}
        </span>
      </span>
    </Link>
  );
}

function ModeSection({
  title,
  description,
  icon,
  accent,
  modes,
  gridClassName,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: "neutral" | "kai" | "consent";
  modes: OneDashboardMode[];
  gridClassName: string;
}) {
  if (modes.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby={`one-section-${title.toLowerCase()}`}
      className="space-y-2"
    >
      <SectionHeader
        id={`one-section-${title.toLowerCase()}`}
        title={title}
        description={description}
        icon={icon}
        accent={accent}
        className="px-0"
        testId={`one-${title.toLowerCase()}-section`}
      />
      <div className={cn("grid gap-2 sm:gap-2.5", gridClassName)}>
        {modes.map((mode) => (
          <ModeTile key={mode.id} mode={mode} />
        ))}
      </div>
    </section>
  );
}

export function OneDashboardPage({
  displayName,
  pendingConsents = 0,
  oneSetupResolved = null,
}: {
  displayName?: string | null;
  pendingConsents?: number;
  oneSetupResolved?: boolean | null;
}) {
  const firstName =
    String(displayName || "")
      .trim()
      .split(/\s+/)[0] || "there";
  const modes = buildModes(pendingConsents, oneSetupResolved);
  const workflowModes = modes.filter((mode) => mode.group === "workflow");
  const memoryModes = modes.filter((mode) => mode.group === "memory");
  const accessModes = modes.filter((mode) => mode.group === "access");

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
          eyebrow={`Good to see you, ${firstName}.`}
          title="One dashboard"
          description="Start a workflow, open memory, or review access."
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
          <ModeSection
            title="Workflows"
            description="Finance, email, location, and connected systems."
            icon={Workflow}
            accent="kai"
            modes={workflowModes}
            gridClassName="grid-cols-2 md:grid-cols-4"
          />
          <ModeSection
            title="Memory"
            description="Gmail receipts and saved knowledge."
            icon={BrainCircuit}
            accent="neutral"
            modes={memoryModes}
            gridClassName="grid-cols-1 sm:grid-cols-2"
          />
          <ModeSection
            title="Access"
            description="Approvals and revocations."
            icon={Shield}
            accent="consent"
            modes={accessModes}
            gridClassName="grid-cols-1 sm:grid-cols-2"
          />
        </SurfaceStack>
      </AppPageContentRegion>
    </AppPageShell>
  );
}
