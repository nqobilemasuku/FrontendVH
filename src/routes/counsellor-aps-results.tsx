import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CounsellorShell } from "@/components/CounsellorShell";
import {
  GraduationCap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Layers,
  ListChecks,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  Panel,
  StatusPill,
  BarRow,
  ProgressBar,
  type Tone,
} from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";

export const Route = createFileRoute("/counsellor-aps-results")({
  head: () => ({ meta: [{ title: "APS & Results · Varsity Hub" }] }),
  component: CounsellorApsResults,
});

type LearnerListItem = {
  id: string;
  fullName: string;
  email: string | null;
  aps: number | null;
  schoolName: string | null;
  grade: number | null;
};

function apsTone(aps: number | null): Tone {
  if (aps == null) return "slate";
  if (aps >= 32) return "emerald";
  if (aps >= 27) return "blue";
  if (aps >= 22) return "amber";
  return "rose";
}

const bands: { label: string; test: (aps: number) => boolean; tone: Tone }[] = [
  { label: "APS 35+", test: (a) => a >= 35, tone: "emerald" },
  { label: "APS 30 to 34", test: (a) => a >= 30 && a < 35, tone: "teal" },
  { label: "APS 25 to 29", test: (a) => a >= 25 && a < 30, tone: "amber" },
  { label: "APS 20 to 24", test: (a) => a >= 20 && a < 25, tone: "orange" },
  { label: "Below 20", test: (a) => a < 20, tone: "rose" },
];

const qualBands: { label: string; test: (aps: number) => boolean; tone: Tone }[] = [
  { label: "Bachelor's Pass (APS 30+)", test: (a) => a >= 30, tone: "emerald" },
  { label: "Diploma Pass (APS 23 to 29)", test: (a) => a >= 23 && a < 30, tone: "blue" },
  { label: "Higher Certificate (APS below 23)", test: (a) => a < 23, tone: "amber" },
];

function CounsellorApsResults() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["counsellor-learners", "aps"],
    queryFn: () => api.get<LearnerListItem[]>("/api/counsellor/learners?"),
  });

  const learners = data ?? [];
  const withAps = learners.filter((l) => l.aps != null) as (LearnerListItem & { aps: number })[];
  const avgAps = withAps.length ? withAps.reduce((a, b) => a + b.aps, 0) / withAps.length : null;
  const highest = withAps.length ? withAps.reduce((a, b) => (b.aps > a.aps ? b : a)) : null;
  const above30 = withAps.filter((l) => l.aps >= 30).length;
  const below25 = withAps.filter((l) => l.aps < 25).length;

  const distribution = bands.map((b) => {
    const count = withAps.filter((l) => b.test(l.aps)).length;
    return { ...b, count, pct: withAps.length ? Math.round((count / withAps.length) * 100) : 0 };
  });
  const maxBand = Math.max(1, ...distribution.map((d) => d.count));

  const qualifications = qualBands.map((q) => {
    const count = withAps.filter((l) => q.test(l.aps)).length;
    return { ...q, count, pct: withAps.length ? Math.round((count / withAps.length) * 100) : 0 };
  });

  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(learners, 10);

  return (
    <CounsellorShell>
      <PageHeader
        eyebrow="Counsellor workspace"
        title="APS & Academic Results"
        subtitle="School wide academic performance and APS analytics"
        icon={GraduationCap}
        tone="indigo"
      />

      {isLoading && <TableSkeleton />}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load learner results.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={GraduationCap}
              tone="indigo"
              label="School Average APS"
              value={avgAps != null ? avgAps.toFixed(1) : "—"}
              hint={`Across ${withAps.length} learners`}
            />
            <StatCard
              icon={Award}
              tone="emerald"
              label="Highest APS"
              value={highest?.aps ?? "—"}
              hint={highest?.fullName ?? "—"}
            />
            <StatCard
              icon={ArrowUpRight}
              tone="teal"
              label="Learners Above 30"
              value={above30}
              hint="Bachelor's eligible"
            />
            <StatCard
              icon={ArrowDownRight}
              tone="rose"
              label="Learners Below 25"
              value={below25}
              hint="Need support"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel
              title="APS Score Distribution"
              description={`${withAps.length} learners by band`}
              icon={BarChart3}
              tone="indigo"
            >
              <div className="space-y-4">
                {distribution.map((d) => (
                  <BarRow
                    key={d.label}
                    label={d.label}
                    value={d.count}
                    max={maxBand}
                    tone={d.tone}
                    valueLabel={`${d.count} · ${d.pct}%`}
                    labelWidth="w-24"
                  />
                ))}
              </div>
            </Panel>

            <Panel
              title="Qualification Distribution"
              description="Eligibility breakdown"
              icon={Layers}
              tone="indigo"
            >
              <div className="space-y-5">
                {qualifications.map((q) => (
                  <div key={q.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium">{q.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {q.count} · {q.pct}%
                      </span>
                    </div>
                    <ProgressBar value={q.pct} tone={q.tone} />
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="mt-6">
            <Panel
              title="Learner APS Summary"
              description={`${learners.length} learner${learners.length === 1 ? "" : "s"}`}
              icon={ListChecks}
              tone="indigo"
              flush
            >
              {learners.length === 0 ? (
                <div className="px-5 py-16 text-center text-sm text-muted-foreground">
                  No learners found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold">Learner</th>
                        <th className="px-5 py-3 text-left font-semibold">APS</th>
                        <th className="hidden px-5 py-3 text-left font-semibold sm:table-cell">
                          Grade
                        </th>
                        <th className="px-5 py-3 text-left font-semibold">School</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((l) => (
                        <tr
                          key={l.id}
                          className="border-t border-border/50 transition-colors hover:bg-muted/30"
                        >
                          <td className="px-5 py-3.5 font-medium">{l.fullName}</td>
                          <td className="px-5 py-3.5">
                            <StatusPill tone={apsTone(l.aps)} dot={false}>
                              {l.aps ?? "—"}
                            </StatusPill>
                          </td>
                          <td className="hidden px-5 py-3.5 tabular-nums text-muted-foreground sm:table-cell">
                            {l.grade ?? "—"}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {l.schoolName ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-5 pb-4">
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      total={total}
                      from={from}
                      to={to}
                      setPage={setPage}
                      noun="learners"
                    />
                  </div>
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </CounsellorShell>
  );
}
