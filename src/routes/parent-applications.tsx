import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Users } from "lucide-react";
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

export const Route = createFileRoute("/parent-applications")({
  head: () => ({ meta: [{ title: "Applications Progress · Varsity Hub" }] }),
  component: ParentApplications,
});

type ChildItem = {
  id: string;
  fullName: string;
  aps: number | null;
  schoolName: string | null;
  grade: number | null;
  relationship: string | null;
};

type ChildApplication = {
  id: string;
  university: string;
  programme: string;
  status: string;
  createdAt: string;
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

function ParentApplications() {
  const [childId, setChildId] = useState<string | null>(null);

  const children = useQuery({
    queryKey: ["parent-children"],
    queryFn: () => api.get<ChildItem[]>("/api/parent/children"),
  });
  const list = children.data ?? [];
  const activeId = childId ?? list[0]?.id ?? null;

  const apps = useQuery({
    queryKey: ["parent-applications", activeId],
    queryFn: () => api.get<ChildApplication[]>(`/api/parent/children/${activeId}/applications`),
    enabled: !!activeId,
  });
  const rows = apps.data ?? [];
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(rows, 10);

  const count = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <ParentShell>
      <PageHeader
        eyebrow="Parent / Guardian"
        title="Applications Progress"
        subtitle="Track your learner's university applications · read only."
        icon={FileText}
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
            Applications will appear here once a learner links you as their guardian.
          </p>
        </div>
      )}

      {!children.isLoading && !children.isError && list.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={FileText}
              tone="emerald"
              label="Applications"
              value={apps.isLoading ? "—" : rows.length}
              hint="Total"
            />
            <StatCard
              icon={FileText}
              tone="amber"
              label="Under Review"
              value={apps.isLoading ? "—" : count("under_review")}
              hint="Awaiting decision"
            />
            <StatCard
              icon={FileText}
              tone="blue"
              label="Approved"
              value={apps.isLoading ? "—" : count("approved")}
              hint="Offers"
            />
            <StatCard
              icon={FileText}
              tone="rose"
              label="Pending Docs"
              value={apps.isLoading ? "—" : count("pending_documents")}
              hint="Action required"
            />
          </div>

          <Panel className="mt-6" title="Applications" icon={FileText} tone="emerald" flush>
            {apps.isLoading && <TableSkeleton />}
            {apps.isError && (
              <div className="px-5 py-16 text-center text-sm text-rose-600">
                Couldn't load applications.
              </div>
            )}
            {!apps.isLoading && !apps.isError && (
              <div className="overflow-x-auto">
                <table className={table.el}>
                  <thead className={table.thead}>
                    <tr>
                      <th className={table.th}>University</th>
                      <th className={table.th}>Programme</th>
                      <th className={table.th}>Submitted</th>
                      <th className={table.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((a) => (
                      <tr key={a.id} className={table.row}>
                        <td className={`${table.td} font-medium`}>{a.university}</td>
                        <td className={`${table.td} text-muted-foreground`}>{a.programme}</td>
                        <td className={`${table.td} text-muted-foreground`}>
                          {new Date(a.createdAt).toLocaleDateString("en-ZA", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className={table.td}>
                          <StatusPill tone={statusTone(a.status)}>
                            {statusLabel(a.status)}
                          </StatusPill>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-16 text-center text-sm text-muted-foreground"
                        >
                          No applications yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} setPage={setPage} noun="applications" />
              </div>
            )}
          </Panel>
        </>
      )}
    </ParentShell>
  );
}
