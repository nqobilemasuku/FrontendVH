import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CounsellorShell } from "@/components/CounsellorShell";
import { Award, GraduationCap, History, Plus, Loader2 } from "lucide-react";
import { PageHeader, Panel, StatusPill, IconBadge, btn } from "@/components/dashboard/ui";
import { ListSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";

export const Route = createFileRoute("/counsellor-recommendations")({
  head: () => ({ meta: [{ title: "Recommendations · Varsity Hub" }] }),
  component: CounsellorRecommendations,
});

type LearnerListItem = { id: string; fullName: string; aps: number | null };

type RecommendationDto = {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
};

function CounsellorRecommendations() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const listQuery = useQuery({
    queryKey: ["counsellor-learners", "recommendations"],
    queryFn: () => api.get<LearnerListItem[]>("/api/counsellor/learners?"),
  });
  const learner = listQuery.data?.[0] ?? null;
  const learnerId = learner?.id ?? null;

  const recsQuery = useQuery({
    queryKey: ["counsellor-recommendations", learnerId],
    queryFn: () =>
      api.get<RecommendationDto[]>(`/api/counsellor/learners/${learnerId}/recommendations`),
    enabled: !!learnerId,
  });
  const recommendations = recsQuery.data ?? [];

  const add = useMutation({
    mutationFn: () =>
      api.post(`/api/counsellor/learners/${learnerId}/recommendations`, { title, body }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      qc.invalidateQueries({ queryKey: ["counsellor-recommendations", learnerId] });
    },
  });

  return (
    <CounsellorShell>
      <PageHeader
        eyebrow="Counsellor workspace"
        title="Programme Recommendations"
        subtitle="View and assign programme recommendations to your learner"
        icon={Award}
        tone="indigo"
      />

      {listQuery.isLoading && <ListSkeleton />}
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
            description="Recommendations are assigned to this learner"
            icon={GraduationCap}
            tone="indigo"
          >
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
                <div className="mt-1">
                  <StatusPill tone="indigo" dot={false}>
                    APS {learner.aps ?? "—"}
                  </StatusPill>
                </div>
              </div>
            </div>
          </Panel>

          <div className="mt-6">
            <Panel
              title="Add Recommendation"
              description="Suggest a programme or next step"
              icon={Plus}
              tone="indigo"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (title.trim()) add.mutate();
                }}
                className="flex flex-col gap-3"
              >
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Recommendation title (e.g. BSc Computer Science at Wits)"
                  className="w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Notes / rationale (optional)"
                  rows={3}
                  className="w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className={btn.primary}
                    disabled={add.isPending || !title.trim()}
                  >
                    {add.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}{" "}
                    Add recommendation
                  </button>
                  {add.isError && (
                    <span className="text-sm text-rose-600">Couldn't save. Try again.</span>
                  )}
                </div>
              </form>
            </Panel>
          </div>

          <div className="mt-6">
            <Panel
              title="Recommendations"
              description={`${recommendations.length} recorded`}
              icon={History}
              tone="indigo"
            >
              {recsQuery.isLoading && <ListSkeleton />}
              {recsQuery.isError && (
                <div className="py-10 text-center text-sm text-rose-600">
                  Couldn't load recommendations.
                </div>
              )}
              {!recsQuery.isLoading && !recsQuery.isError && recommendations.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No recommendations yet.
                </div>
              )}
              {!recsQuery.isLoading && !recsQuery.isError && recommendations.length > 0 && (
                <div className="space-y-3">
                  {recommendations.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <IconBadge icon={Award} tone="indigo" size="sm" />
                        <div>
                          <div className="text-sm font-medium">{r.title}</div>
                          {r.body && <div className="text-xs text-muted-foreground">{r.body}</div>}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-ZA", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
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
