import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Users, Lightbulb } from "lucide-react";
import {
  PageHeader,
  StatCard,
  Panel,
  StatusPill,
  IconBadge,
  table,
  type Tone,
} from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { ParentShell } from "@/components/ParentShell";
import { api } from "@/lib/api";
import { usePagination, Pagination } from "@/components/dashboard/pagination";

export const Route = createFileRoute("/parent-programmes")({
  head: () => ({ meta: [{ title: "Programme Choices · Varsity Hub" }] }),
  component: ParentProgrammes,
});

type ChildItem = {
  id: string;
  fullName: string;
  aps: number | null;
  schoolName: string | null;
  grade: number | null;
  relationship: string | null;
};

type ProgrammeChoice = {
  applicationId: string;
  university: string;
  programme: string;
  status: string;
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  pending_documents: "Pending Documents",
  approved: "Approved",
  waitlisted: "Waitlisted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};
const statusTones: Record<string, Tone> = {
  draft: "slate",
  submitted: "blue",
  under_review: "amber",
  pending_documents: "rose",
  approved: "emerald",
  waitlisted: "indigo",
  rejected: "rose",
  withdrawn: "slate",
};
const statusLabel = (s: string) => statusLabels[s] ?? s;
const statusTone = (s: string): Tone => statusTones[s] ?? "slate";

function ParentProgrammes() {
  const [childId, setChildId] = useState<string | null>(null);

  const children = useQuery({
    queryKey: ["parent-children"],
    queryFn: () => api.get<ChildItem[]>("/api/parent/children"),
  });
  const list = children.data ?? [];
  const activeId = childId ?? list[0]?.id ?? null;

  const programmesQ = useQuery({
    queryKey: ["parent-programmes", activeId],
    queryFn: () => api.get<ProgrammeChoice[]>(`/api/parent/children/${activeId}/programmes`),
    enabled: !!activeId,
  });
  const rows = programmesQ.data ?? [];
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(rows, 10);

  const approved = rows.filter((r) => r.status === "approved").length;

  return (
    <ParentShell>
      <PageHeader
        eyebrow="Parent / Guardian"
        title="Programme Choices"
        subtitle="Programmes your learner is interested in or has applied to."
        icon={BookOpen}
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

      {children.isLoading && <TableSkeleton />}
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
            Programme choices will appear here once a learner links you as their guardian.
          </p>
        </div>
      )}

      {!children.isLoading && !children.isError && list.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={GraduationCap}
              tone="emerald"
              label="APS Score"
              value={list.find((c) => c.id === activeId)?.aps ?? "—"}
              hint="Learner's profile"
            />
            <StatCard
              icon={BookOpen}
              tone="teal"
              label="Programme Choices"
              value={programmesQ.isLoading ? "—" : rows.length}
              hint="Selected"
            />
            <StatCard
              icon={BookOpen}
              tone="blue"
              label="Universities"
              value={programmesQ.isLoading ? "—" : new Set(rows.map((r) => r.university)).size}
              hint="Applied to"
            />
            <StatCard
              icon={GraduationCap}
              tone="indigo"
              label="Offers"
              value={programmesQ.isLoading ? "—" : approved}
              hint="Approved"
            />
          </div>

          <Panel
            className="mt-6"
            title="Programme Choices"
            description="Universities and programmes your learner has chosen"
            icon={BookOpen}
            tone="emerald"
            flush
          >
            {programmesQ.isLoading && <TableSkeleton />}
            {programmesQ.isError && (
              <div className="px-5 py-16 text-center text-sm text-rose-600">
                Couldn't load programme choices.
              </div>
            )}
            {!programmesQ.isLoading && !programmesQ.isError && (
              <div className="overflow-x-auto">
                <table className={table.el}>
                  <thead className={table.thead}>
                    <tr>
                      <th className={table.th}>Programme</th>
                      <th className={table.th}>University</th>
                      <th className={table.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((p) => (
                      <tr key={p.applicationId} className={table.row}>
                        <td className={`${table.td} font-medium`}>{p.programme}</td>
                        <td className={`${table.td} text-muted-foreground`}>{p.university}</td>
                        <td className={table.td}>
                          <StatusPill tone={statusTone(p.status)}>
                            {statusLabel(p.status)}
                          </StatusPill>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-16 text-center text-sm text-muted-foreground"
                        >
                          No programme choices yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} setPage={setPage} noun="programmes" />
              </div>
            )}
          </Panel>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
            <IconBadge icon={Lightbulb} tone="emerald" />
            <div>
              <p className="text-sm font-semibold">Did you know?</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Encourage your learner to apply to at least 3 to 5 programmes to improve their
                chances of receiving an offer.
              </p>
            </div>
          </div>
        </>
      )}
    </ParentShell>
  );
}
