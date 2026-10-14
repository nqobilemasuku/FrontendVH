import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  PiggyBank,
  GraduationCap,
  Bell,
} from "lucide-react";
import { PageHeader, StatCard, StatusPill, IconBadge, type Tone } from "@/components/dashboard/ui";
import { ListSkeleton } from "@/components/dashboard/skeletons";
import { ParentShell } from "@/components/ParentShell";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parent-deadlines")({
  head: () => ({ meta: [{ title: "Application Deadlines · Varsity Hub" }] }),
  component: ParentDeadlines,
});

type ChildItem = {
  id: string;
  fullName: string;
  aps: number | null;
  schoolName: string | null;
  grade: number | null;
  relationship: string | null;
};

type DeadlineItem = {
  kind: string;
  title: string;
  due: string;
};

const kindMeta: Record<string, { label: string; icon: typeof CalendarDays }> = {
  programme: { label: "Programme", icon: GraduationCap },
  bursary: { label: "Bursary", icon: PiggyBank },
};

function daysLeft(iso: string): number {
  const due = new Date(iso);
  const start = new Date();
  due.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - start.getTime()) / 86400000);
}
function toneFor(d: number): Tone {
  if (d < 0) return "rose";
  if (d <= 7) return "rose";
  if (d <= 30) return "amber";
  return "slate";
}
const dotClass: Record<Tone, string> = {
  primary: "bg-primary",
  violet: "bg-violet-500",
  fuchsia: "bg-fuchsia-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  sky: "bg-sky-500",
  cyan: "bg-cyan-500",
  indigo: "bg-indigo-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  rose: "bg-rose-500",
  slate: "bg-slate-500",
};

function ParentDeadlines() {
  const [childId, setChildId] = useState<string | null>(null);

  const children = useQuery({
    queryKey: ["parent-children"],
    queryFn: () => api.get<ChildItem[]>("/api/parent/children"),
  });
  const list = children.data ?? [];
  const activeId = childId ?? list[0]?.id ?? null;

  const deadlinesQ = useQuery({
    queryKey: ["parent-deadlines", activeId],
    queryFn: () => api.get<DeadlineItem[]>(`/api/parent/children/${activeId}/deadlines`),
    enabled: !!activeId,
  });

  const rows = [...(deadlinesQ.data ?? [])].sort(
    (a, b) => new Date(a.due).getTime() - new Date(b.due).getTime(),
  );

  const overdue = rows.filter((r) => daysLeft(r.due) < 0).length;
  const thisWeek = rows.filter((r) => {
    const d = daysLeft(r.due);
    return d >= 0 && d <= 7;
  }).length;
  const thisMonth = rows.filter((r) => {
    const d = daysLeft(r.due);
    return d >= 0 && d <= 30;
  }).length;

  return (
    <ParentShell>
      <PageHeader
        eyebrow="Parent / Guardian"
        title="Application Deadlines"
        subtitle="Stay on top of all upcoming submission deadlines."
        icon={CalendarDays}
        tone="emerald"
        actions={
          list.length > 1 ? (
            <select
              value={activeId ?? ""}
              onChange={(e) => setChildId(e.target.value)}
              className="rounded-lg border border-border/70 bg-card px-3 py-2 text-sm font-medium shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          ) : null
        }
      />

      {children.isLoading && <ListSkeleton />}
      {children.isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load your linked learners.
        </div>
      )}
      {!children.isLoading && !children.isError && list.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
          <IconBadge icon={Users} tone="slate" className="mx-auto" />
          <p className="mt-4 text-sm font-semibold">No linked learners yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Deadlines will appear here once a learner links you as their guardian.
          </p>
        </div>
      )}

      {!children.isLoading && !children.isError && list.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={AlertTriangle}
              tone="rose"
              label="Overdue"
              value={deadlinesQ.isLoading ? "—" : overdue}
              hint="Past due"
            />
            <StatCard
              icon={Clock}
              tone="amber"
              label="Due This Week"
              value={deadlinesQ.isLoading ? "—" : thisWeek}
              hint="Within 7 days"
            />
            <StatCard
              icon={CalendarDays}
              tone="blue"
              label="Due This Month"
              value={deadlinesQ.isLoading ? "—" : thisMonth}
              hint="Within 30 days"
            />
            <StatCard
              icon={CheckCircle2}
              tone="emerald"
              label="Total Deadlines"
              value={deadlinesQ.isLoading ? "—" : rows.length}
              hint="Tracked"
            />
          </div>

          <div className="mt-6">
            {deadlinesQ.isLoading && <ListSkeleton />}
            {deadlinesQ.isError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
                Couldn't load deadlines.
              </div>
            )}
            {!deadlinesQ.isLoading && !deadlinesQ.isError && rows.length === 0 && (
              <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
                No upcoming deadlines.
              </div>
            )}
            {!deadlinesQ.isLoading && !deadlinesQ.isError && rows.length > 0 && (
              <ol className="relative space-y-4 border-l border-border/60 pl-6">
                {rows.map((d, i) => {
                  const days = daysLeft(d.due);
                  const tone = toneFor(days);
                  const meta = kindMeta[d.kind] ?? { label: d.kind, icon: CalendarDays };
                  const due = new Date(d.due);
                  return (
                    <li key={`${d.kind}-${d.title}-${i}`} className="relative">
                      <span className="absolute -left-7.75 top-4 flex h-3 w-3 items-center justify-center">
                        <span
                          className={cn("h-3 w-3 rounded-full ring-4 ring-card", dotClass[tone])}
                        />
                      </span>
                      <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-md)">
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-muted text-center leading-none">
                          <span className="text-lg font-bold tabular-nums">
                            {due.toLocaleDateString("en-ZA", { day: "2-digit" })}
                          </span>
                          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {due.toLocaleDateString("en-ZA", { month: "short" })}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <meta.icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {meta.label}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate font-semibold leading-tight">{d.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Due{" "}
                            {due.toLocaleDateString("en-ZA", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <StatusPill tone={tone}>
                          {days < 0
                            ? `${Math.abs(days)}d overdue`
                            : days === 0
                              ? "Due today"
                              : `${days}d left`}
                        </StatusPill>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
            <IconBadge icon={Bell} tone="emerald" />
            <div>
              <p className="text-sm font-semibold">Tip</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Set reminders to ensure no deadlines are missed. Applications submitted early are
                processed faster.
              </p>
            </div>
          </div>
        </>
      )}
    </ParentShell>
  );
}
