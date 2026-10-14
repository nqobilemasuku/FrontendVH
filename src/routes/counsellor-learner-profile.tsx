import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CounsellorShell } from "@/components/CounsellorShell";
import { ArrowLeft, GraduationCap, Percent, Award } from "lucide-react";
import { StatCard, Panel, StatusPill, type Tone } from "@/components/dashboard/ui";
import { PanelSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";

export const Route = createFileRoute("/counsellor-learner-profile")({
  head: () => ({ meta: [{ title: "Learner Profile · Varsity Hub" }] }),
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: CounsellorLearnerProfile,
});

type LearnerListItem = { id: string; fullName: string };

type LearnerDetail = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  province: string | null;
  schoolName: string | null;
  grade: number | null;
  aps: number | null;
};

type ResultRow = {
  id: string;
  subjectName: string;
  level: number;
  percentage: number;
  isLifeOrientation: boolean;
};

function markTone(mark: number): Tone {
  if (mark >= 75) return "emerald";
  if (mark >= 60) return "blue";
  return "amber";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

function CounsellorLearnerProfile() {
  const { id: searchId } = Route.useSearch();

  // If no id in the URL, fall back to the first learner in the roster.
  const listQuery = useQuery({
    queryKey: ["counsellor-learners", "first"],
    queryFn: () => api.get<LearnerListItem[]>("/api/counsellor/learners?"),
    enabled: !searchId,
  });

  const learnerId = searchId ?? listQuery.data?.[0]?.id ?? null;

  const detailQuery = useQuery({
    queryKey: ["counsellor-learner", learnerId],
    queryFn: () => api.get<LearnerDetail>(`/api/counsellor/learners/${learnerId}`),
    enabled: !!learnerId,
  });

  const resultsQuery = useQuery({
    queryKey: ["counsellor-learner-results", learnerId],
    queryFn: () => api.get<ResultRow[]>(`/api/counsellor/learners/${learnerId}/results`),
    enabled: !!learnerId,
  });

  const learner = detailQuery.data;
  const results = resultsQuery.data ?? [];
  const academicResults = results.filter((r) => !r.isLifeOrientation);
  const avgMark = academicResults.length
    ? Math.round(academicResults.reduce((a, b) => a + b.percentage, 0) / academicResults.length)
    : null;

  const isLoading = (!searchId && listQuery.isLoading) || detailQuery.isLoading;
  const isError = listQuery.isError || detailQuery.isError;
  const noLearner = !learnerId && !listQuery.isLoading;

  return (
    <CounsellorShell>
      <Link
        to="/counsellor-learners"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Learners
      </Link>

      {isLoading && <PanelSkeleton />}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load this learner.
        </div>
      )}
      {noLearner && (
        <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
          No learners found in your roster.
        </div>
      )}

      {!isLoading && !isError && learner && (
        <>
          <Panel>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-400 text-xl font-bold text-white shadow-(--shadow-soft)">
                {initials(learner.fullName)}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold tracking-tight">{learner.fullName}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{learner.grade != null ? `Grade ${learner.grade}` : "Grade —"}</span>
                  <span className="text-muted-foreground/40">•</span>
                  <span>{learner.schoolName ?? "—"}</span>
                  <span className="text-muted-foreground/40">•</span>
                  <span>{learner.province ?? "—"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone="indigo" dot={false}>
                    APS {learner.aps ?? "—"}
                  </StatusPill>
                  {learner.email && (
                    <StatusPill tone="blue" dot={false}>
                      {learner.email}
                    </StatusPill>
                  )}
                  {learner.phone && (
                    <StatusPill tone="slate" dot={false}>
                      {learner.phone}
                    </StatusPill>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={Award}
              tone="indigo"
              label="APS Score"
              value={learner.aps ?? "—"}
              hint="Latest calculation"
            />
            <StatCard
              icon={Percent}
              tone="emerald"
              label="Overall Average"
              value={avgMark != null ? `${avgMark}%` : "—"}
              hint={`Across ${academicResults.length} subjects`}
            />
            <StatCard
              icon={GraduationCap}
              tone="blue"
              label="Qualification Pass"
              value={
                learner.aps != null && learner.aps >= 30
                  ? "Bachelor's"
                  : learner.aps != null && learner.aps >= 23
                    ? "Diploma"
                    : "—"
              }
              hint="Eligible APS 30+"
            />
          </div>

          <div className="mt-6">
            <Panel
              title="Subject Performance"
              description={`${results.length} subject${results.length === 1 ? "" : "s"}`}
              icon={GraduationCap}
              tone="indigo"
              flush
            >
              {resultsQuery.isLoading && <TableSkeleton cols={4} />}
              {resultsQuery.isError && (
                <div className="px-5 py-16 text-center text-sm text-rose-600">
                  Couldn't load results.
                </div>
              )}
              {!resultsQuery.isLoading && !resultsQuery.isError && results.length === 0 && (
                <div className="px-5 py-16 text-center text-sm text-muted-foreground">
                  No results captured yet.
                </div>
              )}
              {!resultsQuery.isLoading && !resultsQuery.isError && results.length > 0 && (
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold">Subject</th>
                      <th className="px-5 py-3 text-left font-semibold">Level</th>
                      <th className="px-5 py-3 text-right font-semibold">Mark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr
                        key={r.id}
                        className="border-t border-border/50 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-5 py-3.5 font-medium">
                          {r.subjectName}
                          {r.isLifeOrientation && (
                            <span className="ml-2 text-xs text-muted-foreground">(LO)</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                          {r.level}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <StatusPill tone={markTone(r.percentage)} dot={false}>
                            {r.percentage}%
                          </StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>
        </>
      )}
    </CounsellorShell>
  );
}
