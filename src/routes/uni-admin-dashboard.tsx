import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UniversityAdminShell } from "@/components/UniversityAdminShell";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  FileWarning,
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { StatCard, Panel, BarRow, type Tone } from "@/components/dashboard/ui";
import { StatCardsSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";

export const Route = createFileRoute("/uni-admin-dashboard")({
  head: () => ({ meta: [{ title: "University Dashboard · Varsity Hub" }] }),
  component: UniAdminDashboard,
});

type UniSummary = {
  total: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  pendingDocuments: number;
  newToday: number;
};

function UniAdminDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["uni-admin", "summary"],
    queryFn: () => api.get<UniSummary>("/api/uni-admin/summary"),
  });

  const stats: { icon: typeof ClipboardList; label: string; value: number; tone: Tone }[] = [
    { icon: ClipboardList, label: "Total Applications", value: data?.total ?? 0, tone: "blue" },
    { icon: Clock, label: "Under Review", value: data?.underReview ?? 0, tone: "amber" },
    { icon: CheckCircle2, label: "Approved", value: data?.approved ?? 0, tone: "emerald" },
    { icon: XCircle, label: "Rejected", value: data?.rejected ?? 0, tone: "rose" },
    { icon: FileWarning, label: "Pending Docs", value: data?.pendingDocuments ?? 0, tone: "orange" },
  ];

  const breakdown: { label: string; value: number; tone: Tone }[] = [
    { label: "Submitted", value: data?.submitted ?? 0, tone: "blue" },
    { label: "Under Review", value: data?.underReview ?? 0, tone: "amber" },
    { label: "Pending Docs", value: data?.pendingDocuments ?? 0, tone: "orange" },
    { label: "Approved", value: data?.approved ?? 0, tone: "emerald" },
    { label: "Rejected", value: data?.rejected ?? 0, tone: "rose" },
  ];
  const maxBreakdown = Math.max(1, ...breakdown.map((b) => b.value));

  return (
    <UniversityAdminShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-cyan-400 text-lg font-bold text-white shadow-(--shadow-soft)">
          UH
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            University Admissions Dashboard
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back 👋</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage and review incoming applications.</p>
        </div>
      </div>

      {isLoading && <StatCardsSkeleton count={5} />}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load the dashboard summary.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {(data?.newToday ?? 0) > 0 && (
            <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 ring-1 ring-blue-200">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">
                  {data?.newToday} new application{data?.newToday === 1 ? "" : "s"} today
                </p>
                <p className="text-xs text-blue-700">Review new submissions to keep applications moving.</p>
              </div>
              <Link
                to={"/uni-admin-applications" as any}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Review applications
              </Link>
            </div>
          )}

          {(data?.pendingDocuments ?? 0) > 0 && (
            <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 ring-1 ring-amber-200">
                <FileWarning className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">
                  {data?.pendingDocuments} application{data?.pendingDocuments === 1 ? "" : "s"} awaiting documents
                </p>
                <p className="text-xs text-amber-700">Request outstanding documents to keep applications moving.</p>
              </div>
              <Link
                to={"/uni-admin-documents" as any}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
              >
                View pending
              </Link>
            </div>
          )}

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <Panel
              className="lg:col-span-2"
              title="Applications overview"
              icon={ClipboardList}
              tone="blue"
              action={
                <Link
                  to={"/uni-admin-applications" as any}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              <div className="space-y-3.5">
                {breakdown.map((b) => (
                  <BarRow
                    key={b.label}
                    label={b.label}
                    value={b.value}
                    max={maxBreakdown}
                    tone={b.tone}
                    labelWidth="w-28"
                  />
                ))}
              </div>
            </Panel>

            <Panel title="Status breakdown" icon={BookOpen} tone="blue" description="Current cycle">
              <dl className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-muted-foreground">Total</dt>
                  <dd className="font-semibold tabular-nums">{data?.total ?? 0}</dd>
                </div>
                {breakdown.map((b) => (
                  <div key={b.label} className="flex items-center justify-between text-sm">
                    <dt className="text-muted-foreground">{b.label}</dt>
                    <dd className="font-semibold tabular-nums">{b.value}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border/60 pt-3 text-sm">
                  <dt className="text-muted-foreground">New today</dt>
                  <dd className="font-semibold tabular-nums">{data?.newToday ?? 0}</dd>
                </div>
              </dl>
            </Panel>
          </div>
        </>
      )}
    </UniversityAdminShell>
  );
}
