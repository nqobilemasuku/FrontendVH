/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentShell } from "@/components/StudentShell";
import {
  GraduationCap,
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Save,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  Panel,
  StatusPill,
  table,
  btn,
} from "@/components/dashboard/ui";
import { StatCardsSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/academic-results")({
  head: () => ({ meta: [{ title: "Academic Results · Varsity Hub" }] }),
  component: AcademicResults,
});

type ResultRow = {
  id: string;
  subjectName: string;
  level: number;
  percentage: number;
  isLifeOrientation: boolean;
};
type ResultInput = {
  subjectName: string;
  level: number;
  percentage: number;
  isLifeOrientation: boolean;
};

function apsFromLevel(level: number) {
  if (level >= 7) return 7;
  if (level >= 1) return level;
  return 0;
}
function markClass(mark: number) {
  if (mark >= 80) return "text-emerald-600";
  if (mark >= 70) return "text-blue-600";
  if (mark >= 60) return "text-amber-600";
  return "text-rose-600";
}
function normaliseAps(x: unknown): number | null {
  if (typeof x === "number") return x;
  if (x && typeof x === "object" && typeof (x as any).aps === "number") return (x as any).aps;
  return null;
}

// Standard NSC subjects — reference list for the capture autocomplete (free text still allowed).
const NSC_SUBJECTS = [
  "English Home Language", "English First Additional Language", "Afrikaans Home Language",
  "IsiZulu", "IsiXhosa", "Sepedi", "Setswana", "Sesotho",
  "Mathematics", "Mathematical Literacy", "Physical Sciences", "Life Sciences",
  "Life Orientation", "Accounting", "Business Studies", "Economics",
  "Geography", "History", "Information Technology", "Computer Applications Technology",
  "Tourism", "Consumer Studies", "Dramatic Arts", "Visual Arts", "Music",
  "Engineering Graphics and Design", "Agricultural Sciences", "Religion Studies",
];

function AcademicResults() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<ResultRow[] | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["me", "results"],
    queryFn: () => api.get<ResultRow[]>("/api/me/results"),
  });
  const { data: apsRaw } = useQuery({
    queryKey: ["me", "aps"],
    queryFn: () => api.get<unknown>("/api/me/aps"),
  });

  useEffect(() => {
    if (data) setRows(data.map((r) => ({ ...r })));
  }, [data]);

  const save = useMutation({
    mutationFn: (body: ResultInput[]) => api.put<ResultRow[]>("/api/me/results", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me", "results"] });
      qc.invalidateQueries({ queryKey: ["me", "aps"] });
    },
  });

  const list = rows ?? [];
  const aps = normaliseAps(apsRaw);
  const avg = list.length
    ? Math.round(list.reduce((a, b) => a + (b.percentage || 0), 0) / list.length)
    : 0;
  const distinctions = list.filter((s) => s.percentage >= 80).length;

  function update(id: string, patch: Partial<ResultRow>) {
    setRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, ...patch } : r)) : prev));
  }
  function addRow() {
    const tempId = `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setRows((prev) => [
      ...(prev ?? []),
      { id: tempId, subjectName: "", level: 4, percentage: 0, isLifeOrientation: false },
    ]);
  }
  function removeRow(id: string) {
    setRows((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
  }
  const canSave = list.length > 0 && list.every((r) => r.subjectName.trim().length > 0);
  function commit() {
    save.mutate(
      list.map((r) => ({
        subjectName: r.subjectName,
        level: r.level,
        percentage: r.percentage,
        isLifeOrientation: r.isLifeOrientation,
      })),
    );
  }

  return (
    <StudentShell>
      <PageHeader
        icon={GraduationCap}
        eyebrow="Overview"
        title="Academic Results"
        subtitle="Your Grade 12 NSC results & APS score."
        actions={
          <>
            <button className={btn.outline} onClick={addRow} disabled={isLoading || !rows}>
              <Plus className="h-4 w-4" /> Add subject
            </button>
            <button className={btn.primary} onClick={commit} disabled={save.isPending || isLoading || !canSave}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Results
            </button>
          </>
        }
      />

      <datalist id="nsc-subjects">
        {NSC_SUBJECTS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {isLoading && (
        <div className="space-y-6">
          <StatCardsSkeleton count={3} />
          <TableSkeleton cols={4} />
        </div>
      )}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load your academic results.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {save.isError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              Couldn't save your results. Please try again.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Award}
              tone="primary"
              label="APS Score"
              value={
                <span>
                  {aps ?? "—"}
                  <span className="text-lg font-semibold text-muted-foreground">/42</span>
                </span>
              }
              hint="From your latest results"
            />
            <StatCard
              icon={TrendingUp}
              tone="violet"
              label="Average"
              value={`${avg}%`}
              hint="Across all subjects"
            />
            <StatCard
              icon={CheckCircle2}
              tone="emerald"
              label="Qualifies for"
              value={<span className="text-2xl">{aps != null && aps >= 23 ? "Bachelor's" : aps != null && aps >= 19 ? "Diploma" : "—"}</span>}
              hint="Estimated entry level"
            />
            <StatCard
              icon={BookOpen}
              tone="blue"
              label="Distinctions"
              value={distinctions}
              hint="Subjects at 80%+"
            />
          </div>

          <Panel
            className="mt-6"
            flush
            icon={BookOpen}
            title="Subjects"
            description={`${list.length} subjects on your National Senior Certificate`}
          >
            <div className="overflow-x-auto">
              <table className={table.el}>
                <thead className={table.thead}>
                  <tr>
                    <th className={table.th}>Subject</th>
                    <th className={cn(table.th, "text-center")}>Life Orientation</th>
                    <th className={cn(table.th, "text-center")}>Level</th>
                    <th className={cn(table.th, "text-center")}>Mark</th>
                    <th className={cn(table.th, "text-center")}>APS</th>
                    <th className={cn(table.th, "text-right")} />
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr key={s.id} className={table.row}>
                      <td className={cn(table.td, "font-medium")}>
                        <input
                          list="nsc-subjects"
                          value={s.subjectName}
                          onChange={(e) => update(s.id, { subjectName: e.target.value })}
                          placeholder="Subject name"
                          className="w-56 rounded border border-border/60 bg-background px-2 py-1 text-sm"
                        />
                      </td>
                      <td className={cn(table.td, "text-center")}>
                        <input
                          type="checkbox"
                          checked={s.isLifeOrientation}
                          onChange={(e) => update(s.id, { isLifeOrientation: e.target.checked })}
                          className="h-4 w-4 accent-primary"
                          aria-label="Life Orientation"
                        />
                      </td>
                      <td className={cn(table.td, "text-center")}>
                        <select
                          value={s.level}
                          onChange={(e) => update(s.id, { level: Number(e.target.value) })}
                          className="rounded border border-border/60 bg-background px-2 py-1 text-sm tabular-nums"
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </td>
                      <td className={cn(table.td, "text-center")}>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={s.percentage}
                          onChange={(e) => update(s.id, { percentage: Number(e.target.value) })}
                          className={cn("w-20 rounded border border-border/60 bg-background px-2 py-1 text-center text-sm font-semibold tabular-nums", markClass(s.percentage))}
                        />
                      </td>
                      <td className={cn(table.td, "text-center")}>
                        <StatusPill tone="primary" dot={false}>
                          {s.isLifeOrientation ? "—" : apsFromLevel(s.level)}
                        </StatusPill>
                      </td>
                      <td className={cn(table.td, "text-right")}>
                        <button
                          type="button"
                          title="Remove subject"
                          onClick={() => removeRow(s.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <p className="text-sm text-muted-foreground">No results captured yet.</p>
                        <button className={cn(btn.primary, "mt-4")} onClick={addRow}>
                          <Plus className="h-4 w-4" /> Add your first subject
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
                {aps != null && (
                  <tfoot>
                    <tr className="border-t border-border/60 bg-muted/30">
                      <td className={cn(table.td, "font-semibold")} colSpan={4}>
                        Total APS (excluding Life Orientation)
                      </td>
                      <td className={cn(table.td, "text-center")}>
                        <StatusPill tone="primary" dot={false} className="font-bold">
                          {aps}
                        </StatusPill>
                      </td>
                      <td className={table.td} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Panel>

          {aps != null && (
            <Panel className="mt-6" tone="emerald">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                  <div>
                    <h4 className="font-semibold">Explore programmes that match your results</h4>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      With an APS of {aps}, see the programmes you qualify for.
                    </p>
                  </div>
                </div>
                <Link to={"/career-guidance" as any} className={cn(btn.soft, "shrink-0")}>
                  Find programmes <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Panel>
          )}
        </>
      )}
    </StudentShell>
  );
}
