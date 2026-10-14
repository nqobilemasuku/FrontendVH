import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import { ClipboardList } from "lucide-react";
import { PageHeader, Panel, StatusPill, table, type Tone } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-applications")({
  head: () => ({ meta: [{ title: "All Applications · Varsity Hub" }] }),
  component: AdminApplications,
});

type AdminApplication = {
  id: string;
  student: string;
  university: string;
  programme: string;
  status: string;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  pending_docs: "Pending Docs",
  approved: "Approved",
  accepted: "Accepted",
  offer: "Offer",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
  withdrawn: "Withdrawn",
};

const statusTone: Record<string, Tone> = {
  draft: "slate",
  submitted: "blue",
  under_review: "amber",
  pending_docs: "orange",
  approved: "emerald",
  accepted: "emerald",
  offer: "teal",
  rejected: "rose",
  waitlisted: "violet",
  withdrawn: "slate",
};

function statusLabel(s: string) {
  return statusLabels[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const tabs: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "pending_docs", label: "Pending Docs" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function AdminApplications() {
  const [status, setStatus] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-applications", status],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (status) qs.set("status", status);
      qs.set("page", "1");
      qs.set("pageSize", "50");
      return api.get<AdminApplication[]>(`/api/admin/applications?${qs.toString()}`);
    },
  });
  const applications = data ?? [];
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(applications, 10);

  return (
    <SuperAdminShell>
      <PageHeader
        eyebrow="National Administration"
        title="All Applications"
        subtitle="Platform wide application management across all universities."
        icon={ClipboardList}
        tone="fuchsia"
      />

      {/* Status tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setStatus(t.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              status === t.value
                ? "bg-fuchsia-500 text-white shadow-(--shadow-xs)"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Panel flush>
        {isLoading && <TableSkeleton cols={6} />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">
            Couldn't load applications.
          </div>
        )}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto">
            <table className={table.el}>
              <thead className={table.thead}>
                <tr>
                  <th className={table.th}>App ID</th>
                  <th className={table.th}>Student</th>
                  <th className={table.th}>University</th>
                  <th className={table.th}>Programme</th>
                  <th className={table.th}>Status</th>
                  <th className={table.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((a) => (
                  <tr key={a.id} className={table.row}>
                    <td className={cn(table.td, "font-mono text-[11px] text-muted-foreground")}>
                      {a.id}
                    </td>
                    <td className={cn(table.td, "font-medium")}>{a.student}</td>
                    <td className={table.td}>{a.university}</td>
                    <td className={cn(table.td, "text-muted-foreground")}>{a.programme}</td>
                    <td className={table.td}>
                      <StatusPill tone={statusTone[a.status] ?? "slate"}>
                        {statusLabel(a.status)}
                      </StatusPill>
                    </td>
                    <td className={cn(table.td, "text-muted-foreground")}>
                      {new Date(a.createdAt).toLocaleDateString("en-ZA", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-sm text-muted-foreground"
                    >
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              from={from}
              to={to}
              setPage={setPage}
              noun="applications"
            />
          </>
        )}
      </Panel>
    </SuperAdminShell>
  );
}
