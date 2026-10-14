import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UniversityAdminShell } from "@/components/UniversityAdminShell";
import { ToggleLeft, Info, Loader2 } from "lucide-react";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { PageHeader, Panel, StatusPill, type Tone } from "@/components/dashboard/ui";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";

export const Route = createFileRoute("/uni-admin-status")({
  head: () => ({ meta: [{ title: "Status Management · Varsity Hub" }] }),
  component: UniAdminStatus,
});

type UniApplicationDto = {
  id: string;
  studentName: string;
  programmeName: string;
  status: string;
  apsAtApply: number | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  pending_documents: "Pending Documents",
  approved: "Approved",
  waitlisted: "Waitlisted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};
const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

function statusLabel(s: string) {
  return STATUS_LABELS[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function statusTone(s: string): Tone {
  switch (s) {
    case "approved":
      return "emerald";
    case "rejected":
      return "rose";
    case "under_review":
      return "amber";
    case "pending_documents":
      return "orange";
    case "submitted":
      return "blue";
    case "waitlisted":
      return "violet";
    default:
      return "slate";
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function UniAdminStatus() {
  const qc = useQueryClient();
  const [pending, setPending] = useState<Record<string, string>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["uni-admin", "applications", "all"],
    queryFn: () => api.get<UniApplicationDto[]>("/api/uni-admin/applications?"),
  });
  const applications = data ?? [];

  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(applications, 10);

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/uni-admin/applications/${id}/status`, { status, note: null }),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["uni-admin", "applications"] });
      qc.invalidateQueries({ queryKey: ["uni-admin", "summary"] });
      setPending((p) => {
        const next = { ...p };
        delete next[vars.id];
        return next;
      });
    },
  });

  return (
    <UniversityAdminShell>
      <PageHeader
        eyebrow="Admissions"
        title="Status Management"
        subtitle="Update application statuses individually."
        icon={ToggleLeft}
        tone="blue"
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 ring-1 ring-blue-200">
          <Info className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-blue-900">Update application statuses</p>
          <p className="text-xs text-blue-700">
            Pick a new status per application and apply. Changes trigger automatic notifications to students.
          </p>
        </div>
      </div>

      <Panel className="mt-6" flush>
        {isLoading && <TableSkeleton />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">Couldn't load applications.</div>
        )}
        {!isLoading && !isError && (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Applicant</th>
                  <th className="px-5 py-3 text-left font-semibold">Programme</th>
                  <th className="px-5 py-3 text-left font-semibold">APS</th>
                  <th className="px-5 py-3 text-left font-semibold">Current Status</th>
                  <th className="px-5 py-3 text-left font-semibold">New Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((a) => {
                  const selected = pending[a.id] ?? "";
                  const isRowPending = changeStatus.isPending && changeStatus.variables?.id === a.id;
                  return (
                    <tr key={a.id} className="border-t border-border/50 transition-colors hover:bg-muted/30">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground">{a.studentName}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{a.id}</div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{a.programmeName}</td>
                      <td className="px-5 py-3.5 font-semibold tabular-nums">{a.apsAtApply ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        <StatusPill tone={statusTone(a.status)}>{statusLabel(a.status)}</StatusPill>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <select
                            value={selected}
                            onChange={(e) => setPending((p) => ({ ...p, [a.id]: e.target.value }))}
                            className="rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                          >
                            <option value="">Select status</option>
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {statusLabel(s)}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => changeStatus.mutate({ id: a.id, status: selected })}
                            disabled={!selected || selected === a.status || isRowPending}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                          >
                            {isRowPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Apply
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground">{fmtDate(a.updatedAt)}</td>
                    </tr>
                  );
                })}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {total > 0 && (
            <div className="px-5 pb-5">
              <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} setPage={setPage} noun="applications" />
            </div>
          )}
          </>
        )}
      </Panel>
    </UniversityAdminShell>
  );
}
