import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CounsellorShell } from "@/components/CounsellorShell";
import { Compass, ChevronDown, GraduationCap, ListChecks, Building2 } from "lucide-react";
import { PageHeader, Panel, StatusPill, IconBadge, type Tone } from "@/components/dashboard/ui";
import { CardGridSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";

export const Route = createFileRoute("/counsellor-career")({
  head: () => ({ meta: [{ title: "Career Guidance · Varsity Hub" }] }),
  component: CounsellorCareer,
});

type LearnerListItem = { id: string; fullName: string; aps: number | null; grade: number | null };

type EligibleProgrammeDto = {
  id: string;
  name: string;
  minAps: number;
  university: string;
  shortCode: string;
};

function apsTone(aps: number | null): Tone {
  if (aps == null) return "slate";
  if (aps >= 32) return "emerald";
  if (aps >= 27) return "blue";
  if (aps >= 22) return "amber";
  return "rose";
}

function CounsellorCareer() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["counsellor-learners", "career"],
    queryFn: () => api.get<LearnerListItem[]>("/api/counsellor/learners?"),
  });
  const learners = listQuery.data ?? [];
  const learner = learners.find((l) => l.id === selectedId) ?? learners[0] ?? null;
  const learnerId = learner?.id ?? null;

  const progQuery = useQuery({
    queryKey: ["counsellor-eligible-programmes", learnerId],
    queryFn: () =>
      api.get<EligibleProgrammeDto[]>(`/api/counsellor/learners/${learnerId}/eligible-programmes`),
    enabled: !!learnerId,
  });
  const programmes = progQuery.data ?? [];

  return (
    <CounsellorShell>
      <PageHeader
        eyebrow="Counsellor workspace"
        title="Career Guidance"
        subtitle="Explore eligible programmes for your learners"
        icon={Compass}
        tone="indigo"
      />

      {listQuery.isLoading && <CardGridSkeleton media={false} />}
      {listQuery.isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load learners.
        </div>
      )}
      {!listQuery.isLoading && !listQuery.isError && !learner && (
        <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
          No learners found in your roster.
        </div>
      )}

      {learner && (
        <>
          <Panel
            title="Selected Learner"
            description="Eligibility is calculated against this learner's APS"
            icon={Compass}
            tone="indigo"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-400 text-sm font-bold text-white shadow-(--shadow-soft)">
                  {learner.fullName
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <div className="font-semibold">{learner.fullName}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {learner.grade != null ? `Grade ${learner.grade}` : "Grade —"}
                    <StatusPill tone={apsTone(learner.aps)} dot={false}>
                      APS {learner.aps ?? "—"}
                    </StatusPill>
                  </div>
                </div>
              </div>
              <div className="relative shrink-0">
                <select
                  value={learner.id}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="appearance-none rounded-lg border border-border/70 bg-card py-2.5 pl-4 pr-9 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/25"
                >
                  {learners.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.fullName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </Panel>

          <div className="mt-6">
            <Panel
              title="Eligible Programmes"
              description={`${programmes.length} matching programme${programmes.length === 1 ? "" : "s"}`}
              icon={ListChecks}
              tone="indigo"
              flush
            >
              {progQuery.isLoading && <CardGridSkeleton media={false} />}
              {progQuery.isError && (
                <div className="px-5 py-16 text-center text-sm text-rose-600">
                  Couldn't load programmes.
                </div>
              )}
              {!progQuery.isLoading && !progQuery.isError && programmes.length === 0 && (
                <div className="px-5 py-16 text-center text-sm text-muted-foreground">
                  No eligible programmes for this learner.
                </div>
              )}
              {!progQuery.isLoading && !progQuery.isError && programmes.length > 0 && (
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  {programmes.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-border/70 bg-card p-5 shadow-(--shadow-card) transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-md)"
                    >
                      <div className="flex items-center gap-3">
                        <IconBadge icon={GraduationCap} tone="indigo" />
                        <h3 className="text-sm font-semibold leading-tight">{p.name}</h3>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground">{p.university}</span>
                        {p.shortCode && (
                          <span className="text-muted-foreground/60">· {p.shortCode}</span>
                        )}
                      </div>
                      <div className="mt-3">
                        <StatusPill tone="indigo" dot={false}>
                          Min APS {p.minAps}
                        </StatusPill>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </CounsellorShell>
  );
}
