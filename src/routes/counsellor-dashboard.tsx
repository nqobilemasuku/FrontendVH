import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CounsellorShell } from "@/components/CounsellorShell";
import {
  Users,
  FileText,
  Award,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Compass,
  GraduationCap,
} from "lucide-react";
import { StatCard, Panel, btn, type Tone } from "@/components/dashboard/ui";
import { StatCardsSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/counsellor-dashboard")({
  head: () => ({ meta: [{ title: "Counsellor Dashboard · Varsity Hub" }] }),
  component: CounsellorDashboard,
});

type CounsellorSummary = {
  learners: number;
  avgAps: number | null;
  inProgress: number;
  missingDocs: number;
};

const quickLinks: {
  to:
    | "/counsellor-learners"
    | "/counsellor-applications"
    | "/counsellor-aps-results"
    | "/counsellor-career";
  label: string;
  description: string;
  icon: typeof Users;
  tone: Tone;
}[] = [
  {
    to: "/counsellor-learners",
    label: "Learners",
    description: "Manage your cohort",
    icon: Users,
    tone: "indigo",
  },
  {
    to: "/counsellor-applications",
    label: "Applications",
    description: "Track outcomes",
    icon: FileText,
    tone: "blue",
  },
  {
    to: "/counsellor-aps-results",
    label: "APS & Results",
    description: "Academic analytics",
    icon: GraduationCap,
    tone: "emerald",
  },
  {
    to: "/counsellor-career",
    label: "Career Guidance",
    description: "Match study paths",
    icon: Compass,
    tone: "violet",
  },
];

function CounsellorDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["counsellor-summary"],
    queryFn: () => api.get<CounsellorSummary>("/api/counsellor/summary"),
  });

  return (
    <CounsellorShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-400 text-lg font-bold text-white shadow-(--shadow-soft)">
          VH
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Counsellor workspace
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back 👋</h1>
        </div>
        <Link to="/counsellor-reports" className={cn(btn.outline, "sm:ml-auto")}>
          <BarChart3 className="h-4 w-4" /> School report
        </Link>
      </div>

      {isLoading && <StatCardsSkeleton />}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load the counsellor summary.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Users}
              tone="indigo"
              label="Total Learners"
              value={data?.learners ?? "—"}
            />
            <StatCard
              icon={Award}
              tone="emerald"
              label="Average APS"
              value={data?.avgAps != null ? data.avgAps.toFixed(1) : "—"}
            />
            <StatCard
              icon={FileText}
              tone="blue"
              label="In Progress"
              value={data?.inProgress ?? "—"}
            />
            <StatCard
              icon={AlertTriangle}
              tone="rose"
              label="Missing Docs"
              value={data?.missingDocs ?? "—"}
            />
          </div>

          {(data?.missingDocs ?? 0) > 0 && (
            <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 ring-1 ring-rose-200">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-900">
                  {data?.missingDocs} learner{data?.missingDocs === 1 ? "" : "s"} have missing
                  documents
                </p>
                <p className="text-xs text-rose-700">
                  Review and notify them before the upcoming deadlines.
                </p>
              </div>
              <Link
                to="/counsellor-missing-docs"
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
              >
                View missing docs
              </Link>
            </div>
          )}

          <div className="mt-6">
            <Panel
              title="Quick links"
              description="Jump into your workspace"
              icon={ArrowRight}
              tone="indigo"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quickLinks.map((q) => (
                  <Link
                    key={q.to}
                    to={q.to}
                    className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-(--shadow-xs) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-md)"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                      <q.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold">{q.label}</div>
                      <div className="text-xs text-muted-foreground">{q.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
    </CounsellorShell>
  );
}
