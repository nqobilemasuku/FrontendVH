import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CounsellorShell } from "@/components/CounsellorShell";
import { FileText, CheckCircle2, Clock, FolderClock, ArrowRight } from "lucide-react";
import { PageHeader, StatCard, Panel, StatusPill, type Tone } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";

export const Route = createFileRoute("/counsellor-applications")({
  head: () => ({ meta: [{ title: "Application Tracking · Varsity Hub" }] }),
  component: CounsellorApplications,
});

type CaseApplication = {
  id: string;
  studentName: string;
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

function statusLabel(status: string) {
  return statusLabels[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusTone(status: string): Tone {
  switch (status) {
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
    default:
      return "slate";
  }
}

const filters: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "under_review", label: "Under Review" },
  { id: "approved", label: "Approved" },
  { id: "pending_documents", label: "Pending Documents" },
  { id: "rejected", label: "Rejected" },
];

function CounsellorApplications() {
  const [status, setStatus] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["counsellor-applications", status],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (status !== "all") qs.set("status", status);
      return api.get<CaseApplication[]>(`/api/counsellor/applications?${qs.toString()}`);
    },
  });
  const applications = data ?? [];

  const count = (s: string) => applications.filter((a) => a.status === s).length;

  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(applications, 10);

  return (
    <CounsellorShell>
      <PageHeader
        eyebrow="Counsellor workspace"
        title="Application Tracking"
        subtitle="Monitor all learner university applications"
        icon={FileText}
        tone="indigo"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          tone="indigo"
          label="Total Applications"
          value={isLoading ? "—" : applications.length}
          hint="Current view"
        />
        <StatCard
          icon={CheckCircle2}
          tone="emerald"
          label="Approved"
          value={isLoading ? "—" : count("approved")}
          hint="Offers received"
        />
        <StatCard
          icon={Clock}
          tone="amber"
          label="Under Review"
          value={isLoading ? "—" : count("under_review")}
          hint="Awaiting outcome"
        />
        <StatCard
          icon={FolderClock}
          tone="orange"
          label="Pending Docs"
          value={isLoading ? "—" : count("pending_documents")}
          hint="Need documents"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setStatus(f.id)}
            className={
              status === f.id
                ? "inline-flex items-center gap-1.5 rounded-full border border-indigo-500 bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600"
                : "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <Panel
          title="Applications"
          description={isLoading ? "Loading…" : `${applications.length} shown`}
          icon={FileText}
          tone="indigo"
          flush
        >
          {isLoading && <TableSkeleton />}
          {isError && (
            <div className="px-5 py-16 text-center text-sm text-rose-600">
              Couldn't load applications.
            </div>
          )}
          {!isLoading && !isError && applications.length === 0 && (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              No applications found.
            </div>
          )}
          {!isLoading && !isError && applications.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Learner name</th>
                    <th className="px-5 py-3 text-left font-semibold">University</th>
                    <th className="hidden px-5 py-3 text-left font-semibold sm:table-cell">
                      Programme
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="hidden px-5 py-3 text-left font-semibold md:table-cell">
                      Submitted
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((a) => (
                    <tr
                      key={a.id}
                      className="border-t border-border/50 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5 font-medium">{a.studentName}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{a.university}</td>
                      <td className="hidden px-5 py-3.5 sm:table-cell">{a.programme}</td>
                      <td className="px-5 py-3.5">
                        <StatusPill tone={statusTone(a.status)}>{statusLabel(a.status)}</StatusPill>
                      </td>
                      <td className="hidden px-5 py-3.5 tabular-nums text-muted-foreground md:table-cell">
                        {new Date(a.createdAt).toLocaleDateString("en-ZA", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to="/counsellor-learner-profile"
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
          {!isLoading && !isError && applications.length > 0 && (
            <div className="px-5 pb-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                from={from}
                to={to}
                setPage={setPage}
                noun="applications"
              />
            </div>
          )}
        </Panel>
      </div>
    </CounsellorShell>
  );
}
