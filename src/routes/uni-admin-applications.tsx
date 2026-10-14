import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UniversityAdminShell } from "@/components/UniversityAdminShell";
import { ClipboardList } from "lucide-react";
import { PageHeader, Panel, StatusPill, type Tone } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";

export const Route = createFileRoute("/uni-admin-applications")({
  head: () => ({ meta: [{ title: "Applications · Varsity Hub" }] }),
  component: UniAdminApplications,
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

const tabs = [
  { id: "all", label: "All" },
  { id: "submitted", label: "Submitted" },
  { id: "under_review", label: "Under Review" },
  { id: "pending_documents", label: "Pending Documents" },
  { id: "approved", label: "Approved" },
  { id: "waitlisted", label: "Waitlisted" },
  { id: "rejected", label: "Rejected" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function UniAdminApplications() {
  const [tab, setTab] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["uni-admin", "applications", tab],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (tab !== "all") qs.set("status", tab);
      return api.get<UniApplicationDto[]>(`/api/uni-admin/applications?${qs.toString()}`);
    },
  });
  const applications = data ?? [];

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: applications.length };
    for (const a of applications) map[a.status] = (map[a.status] ?? 0) + 1;
    return map;
  }, [applications]);

  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(applications, 10);

  return (
    <UniversityAdminShell>
      <PageHeader
        eyebrow="Admissions"
        title="Applications"
        subtitle="Review and manage all incoming student applications."
        icon={ClipboardList}
        tone="blue"
      />

      {/* Status filter tabs */}
      <div className="mb-4 inline-flex max-w-full flex-wrap items-center gap-1 overflow-x-auto rounded-xl bg-muted/40 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-card text-foreground shadow-(--shadow-xs)"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {counts[t.id] != null && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                  tab === t.id ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"
                }`}
              >
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <Panel flush>
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
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Submitted</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((a) => (
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
                    <td className="px-5 py-3.5 text-muted-foreground">{fmtDate(a.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={"/uni-admin-application-details" as any}
                        search={{ id: a.id } as any}
                        className="text-sm font-semibold text-blue-600 transition-colors hover:underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
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
