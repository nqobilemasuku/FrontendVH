/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { StudentShell } from "@/components/StudentShell";
import {
  FileText,
  Clock,
  Award,
  GraduationCap,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Bell,
  Target,
  CheckCircle2,
} from "lucide-react";
import {
  StatCard,
  Panel,
  StatusPill,
  IconBadge,
  btn,
  type Tone,
} from "@/components/dashboard/ui";
import { PanelSkeleton, StatCardsSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Varsity Hub" }] }),
  component: Dashboard,
});

type MeProfile = {
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  province: string | null;
  schoolName: string | null;
  grade: string | null;
};
type ApplicationSummary = {
  id: string;
  universityName: string;
  programmeName: string;
  status: string;
  createdAt: string;
};
type NotificationDetail = {
  id: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
};
type EligibleProgrammeDto = { id: string };
type MeSummary = {
  applications?: number;
  feePaid?: boolean;
  unreadNotifications?: number;
  upcomingDeadlines?: number;
  aps?: number;
};
type Recommendation = {
  id?: string;
  title?: string;
  programmeName?: string;
  name?: string;
  reason?: string;
  description?: string;
};

const statusMeta: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "slate" },
  submitted: { label: "Submitted", tone: "blue" },
  under_review: { label: "Under Review", tone: "amber" },
  pending_documents: { label: "Pending Documents", tone: "orange" },
  approved: { label: "Approved", tone: "emerald" },
  waitlisted: { label: "Waitlisted", tone: "violet" },
  rejected: { label: "Rejected", tone: "rose" },
  withdrawn: { label: "Withdrawn", tone: "slate" },
};
function meta(status: string) {
  return statusMeta[status] ?? { label: status, tone: "slate" as Tone };
}
function initials(name: string) {
  return (name || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function normaliseAps(x: unknown): number | null {
  if (typeof x === "number") return x;
  if (x && typeof x === "object" && typeof (x as any).aps === "number") return (x as any).aps;
  return null;
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

function Dashboard() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => api.get<MeProfile>("/api/me") });
  const apps = useQuery({ queryKey: ["applications"], queryFn: () => api.get<ApplicationSummary[]>("/api/Applications") });
  const notifs = useQuery({
    queryKey: ["notifications", "dashboard"],
    queryFn: () => api.get<NotificationDetail[]>("/api/Notifications?page=1&pageSize=5"),
  });
  const apsQ = useQuery({ queryKey: ["me", "aps"], queryFn: () => api.get<unknown>("/api/me/aps") });
  const eligible = useQuery({
    queryKey: ["me", "eligible-programmes"],
    queryFn: () => api.get<EligibleProgrammeDto[]>("/api/me/eligible-programmes"),
  });
  const summary = useQuery({
    queryKey: ["me", "summary"],
    queryFn: () => api.get<MeSummary>("/api/me/summary"),
  });
  const recs = useQuery({
    queryKey: ["me", "recommendations"],
    queryFn: () => api.get<Recommendation[]>("/api/me/recommendations"),
  });

  const profile = me.data;
  const applications = apps.data ?? [];
  const notifications = notifs.data ?? [];
  const aps = normaliseAps(apsQ.data);
  const eligibleCount = eligible.data?.length ?? null;
  const sum = summary.data ?? {};
  const recommendations = recs.data ?? [];

  const underReview = applications.filter((a) => a.status === "under_review").length;
  const unread = notifications.filter((n) => !n.isRead).length;
  const recentApps = [...applications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Profile completeness from filled fields.
  const fields = profile
    ? [profile.fullName, profile.phone, profile.province, profile.schoolName, profile.grade, profile.avatarUrl]
    : [];
  const completePct = fields.length
    ? Math.round((fields.filter((f) => f && String(f).trim() !== "").length / fields.length) * 100)
    : 0;

  const firstName = profile?.fullName?.split(" ")[0] ?? "there";

  return (
    <StudentShell>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-brand-soft shadow-(--shadow-card)">
        <div className="bg-dots absolute inset-0 opacity-50" />
        <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Application season is open
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
              Welcome back, {me.isLoading ? "…" : firstName} 👋
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground md:text-base">
              You're <span className="font-semibold text-foreground">{completePct}%</span> of the way to a
              complete profile. Finish up to unlock more programme matches.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link to="/applications" className={btn.primary}>
                Continue applications <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/academic-results" className={btn.outline}>
                <Target className="h-4 w-4" /> Check eligibility
              </Link>
            </div>
          </div>
          <ProfileRing value={completePct} />
        </div>
      </div>

      {/* Stats */}
      {summary.isLoading ? (
        <StatCardsSkeleton className="mt-6" />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={FileText} tone="primary" label="Applications" value={sum.applications ?? 0} hint="Total submitted" />
          <StatCard icon={Award} tone="violet" label="APS Score" value={sum.aps ?? "—"} hint="From your results" />
          <StatCard
            icon={CheckCircle2}
            tone={sum.feePaid ? "emerald" : "amber"}
            label="Fee Status"
            value={sum.feePaid ? "Paid" : "Unpaid"}
            hint="Application fee"
          />
          <StatCard icon={Bell} tone="rose" label="Unread" value={sum.unreadNotifications ?? 0} hint="Notifications" />
        </div>
      )}

      {/* Main grid */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Application Overview"
          description="Your most recent university applications"
          action={
            <Link to="/applications" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
          flush
        >
          {apps.isLoading && <PanelSkeleton className="m-5" />}
          {apps.isError && (
            <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
              Couldn't load applications.
            </div>
          )}
          {!apps.isLoading && !apps.isError && (
            <ul className="divide-y divide-border/50">
              {recentApps.map((a) => {
                const m = meta(a.status);
                return (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-brand-cyan text-xs font-bold text-white">
                      {initials(a.universityName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.universityName}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.programmeName}</p>
                    </div>
                    <div className="hidden text-xs text-muted-foreground sm:block">
                      {new Date(a.createdAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" })}
                    </div>
                    <StatusPill tone={m.tone}>{m.label}</StatusPill>
                  </li>
                );
              })}
              {recentApps.length === 0 && (
                <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No applications yet. <Link to="/application-form" className="font-semibold text-primary hover:underline">Start one</Link>.
                </li>
              )}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent Notifications"
          icon={Bell}
          tone="rose"
          description={unread > 0 ? `${unread} unread` : "You're all caught up"}
          action={
            <Link to={"/notifications" as string} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
          flush
        >
          {notifs.isLoading && <PanelSkeleton className="m-5" />}
          {notifs.isError && (
            <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
              Couldn't load notifications.
            </div>
          )}
          {!notifs.isLoading && !notifs.isError && (
            <ul className="divide-y divide-border/50">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-5 py-3.5">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.isRead ? "bg-muted" : "bg-primary")} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", n.isRead ? "font-medium text-muted-foreground" : "font-semibold")}>{n.title}</p>
                    {n.body && <p className="truncate text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                  </div>
                </li>
              ))}
              {notifications.length === 0 && (
                <li className="px-5 py-10 text-center text-sm text-muted-foreground">No notifications.</li>
              )}
            </ul>
          )}
        </Panel>
      </div>

      {/* Counsellor recommendations */}
      <Panel
        className="mt-5"
        icon={Sparkles}
        tone="violet"
        title="Recommended for you"
        description="Career and programme suggestions from your counsellor"
        flush
      >
        {recs.isLoading && <PanelSkeleton className="m-5" />}
        {recs.isError && (
          <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
            Couldn't load recommendations.
          </div>
        )}
        {!recs.isLoading && !recs.isError && (
          <ul className="divide-y divide-border/50">
            {recommendations.map((r, i) => {
              const title = r.title ?? r.programmeName ?? r.name ?? "Recommendation";
              const reason = r.reason ?? r.description;
              return (
                <li key={r.id ?? i} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/30">
                  <IconBadge icon={Target} tone="violet" size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{title}</p>
                    {reason && <p className="mt-0.5 text-xs text-muted-foreground">{reason}</p>}
                  </div>
                </li>
              );
            })}
            {recommendations.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                No recommendations yet. Your counsellor's suggestions will appear here.
              </li>
            )}
          </ul>
        )}
      </Panel>

      {/* Quick links */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="Complete your profile" description={`${completePct}% complete`} className="lg:col-span-2">
          <div className="flex items-center gap-4">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completePct}%` }} />
            </div>
            <span className="text-sm font-bold tabular-nums text-primary">{completePct}%</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link to="/profile" className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5 text-sm transition-colors hover:bg-muted/40">
              <IconBadge icon={CheckCircle2} tone="primary" size="sm" />
              <span className="flex-1 font-medium">Update personal details</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/documents" className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5 text-sm transition-colors hover:bg-muted/40">
              <IconBadge icon={FileText} tone="blue" size="sm" />
              <span className="flex-1 font-medium">Upload documents</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </Panel>

        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-brand p-6 text-white shadow-(--shadow-md)">
          <div className="bg-dots absolute inset-0 opacity-20" />
          <div className="relative">
            <Target className="h-7 w-7" />
            <h3 className="mt-3 text-lg font-bold">Find your perfect match</h3>
            <p className="mt-1 text-sm text-white/80">
              {aps != null
                ? `See the ${eligibleCount ?? ""} programmes you qualify for with an APS of ${aps}.`
                : "See which programmes you qualify for based on your APS."}
            </p>
          </div>
          <Link
            to="/career-guidance"
            className="relative mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-primary transition-transform hover:-translate-y-0.5"
          >
            Explore programmes <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </StudentShell>
  );
}

function ProfileRing({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative mx-auto flex h-36 w-36 shrink-0 items-center justify-center">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.22 300)" />
            <stop offset="100%" stopColor="oklch(0.72 0.15 230)" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="oklch(0.92 0.02 290)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold tracking-tight">{value}%</span>
        <span className="text-xs text-muted-foreground">Profile</span>
      </div>
    </div>
  );
}
