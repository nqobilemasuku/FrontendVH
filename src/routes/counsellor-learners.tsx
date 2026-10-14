import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CounsellorShell } from "@/components/CounsellorShell";
import { Users, GraduationCap, Award, Search, ArrowRight } from "lucide-react";
import { PageHeader, StatCard, Panel, StatusPill, type Tone } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";

export const Route = createFileRoute("/counsellor-learners")({
  head: () => ({ meta: [{ title: "Learners · Varsity Hub" }] }),
  component: CounsellorLearners,
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

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

function CounsellorLearners() {
  const [query, setQuery] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["counsellor-learners", query],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (query.trim()) qs.set("q", query.trim());
      return api.get<LearnerListItem[]>(`/api/counsellor/learners?${qs.toString()}`);
    },
  });

  const learners = data ?? [];
  const grade12 = learners.filter((l) => l.grade === 12).length;
  const withAps = learners.filter((l) => l.aps != null);
  const avgAps = withAps.length
    ? withAps.reduce((a, b) => a + (b.aps ?? 0), 0) / withAps.length
    : null;

  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(learners, 10);

  return (
    <CounsellorShell>
      <PageHeader
        eyebrow="Counsellor workspace"
        title="Learners"
        subtitle="Manage and monitor your learner cohort"
        icon={Users}
        tone="indigo"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          tone="indigo"
          label="Total Learners"
          value={isLoading ? "—" : learners.length}
          hint="Across all grades"
        />
        <StatCard
          icon={GraduationCap}
          tone="blue"
          label="Grade 12"
          value={isLoading ? "—" : grade12}
          hint="Final year cohort"
        />
        <StatCard
          icon={Award}
          tone="emerald"
          label="Average APS"
          value={avgAps != null ? avgAps.toFixed(1) : "—"}
          hint="Cohort mean"
        />
        <StatCard
          icon={Users}
          tone="amber"
          label="With email"
          value={isLoading ? "—" : learners.filter((l) => l.email).length}
          hint="Contactable"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-(--shadow-card) sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search learners by name…"
            className="w-full rounded-lg border border-border/70 bg-card py-2.5 pl-9 pr-3 text-sm shadow-(--shadow-xs) transition-shadow placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
      </div>

      <div className="mt-6">
        <Panel
          title="All Learners"
          description={
            isLoading ? "Loading…" : `${learners.length} learner${learners.length === 1 ? "" : "s"}`
          }
          icon={Users}
          tone="indigo"
          flush
          action={
            <Link
              to="/counsellor-aps-results"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline"
            >
              APS analytics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {isLoading && <TableSkeleton />}
          {isError && (
            <div className="px-5 py-16 text-center text-sm text-rose-600">
              Couldn't load learners.
            </div>
          )}
          {!isLoading && !isError && learners.length === 0 && (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              No learners found.
            </div>
          )}
          {!isLoading && !isError && learners.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Learner</th>
                    <th className="px-5 py-3 text-left font-semibold">APS</th>
                    <th className="hidden px-5 py-3 text-left font-semibold sm:table-cell">
                      School
                    </th>
                    <th className="hidden px-5 py-3 text-left font-semibold md:table-cell">
                      Email
                    </th>
                    <th className="px-5 py-3 text-right font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((l) => (
                    <tr
                      key={l.id}
                      className="border-t border-border/50 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-400 text-xs font-bold text-white">
                            {initials(l.fullName)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{l.fullName}</div>
                            <div className="text-xs text-muted-foreground">
                              {l.grade != null ? `Grade ${l.grade}` : "Grade —"}
                              {l.schoolName ? ` · ${l.schoolName}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill tone={apsTone(l.aps)} dot={false}>
                          {l.aps ?? "—"}
                        </StatusPill>
                      </td>
                      <td className="hidden px-5 py-3.5 text-muted-foreground sm:table-cell">
                        {l.schoolName ?? "—"}
                      </td>
                      <td className="hidden px-5 py-3.5 text-muted-foreground md:table-cell">
                        {l.email ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to="/counsellor-learner-profile"
                          search={{ id: l.id }}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline"
                        >
                          View <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!isLoading && !isError && learners.length > 0 && (
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
          )}
        </Panel>
      </div>
    </CounsellorShell>
  );
}
