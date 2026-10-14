import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CounsellorShell } from "@/components/CounsellorShell";
import { AlertTriangle, FileWarning } from "lucide-react";
import {
  PageHeader,
  StatCard,
  Panel,
  IconBadge,
  StatusPill,
  type Tone,
} from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";

export const Route = createFileRoute("/counsellor-missing-docs")({
  head: () => ({ meta: [{ title: "Missing Docs · Varsity Hub" }] }),
  component: CounsellorMissingDocs,
});

type MissingDocItem = {
  studentId: string;
  fullName: string;
  universityId: string;
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

function CounsellorMissingDocs() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["counsellor-missing-docs"],
    queryFn: () => api.get<MissingDocItem[]>("/api/counsellor/missing-docs"),
  });
  const items = data ?? [];
  const learnersAffected = new Set(items.map((i) => i.studentId)).size;

  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(items, 10);

  return (
    <CounsellorShell>
      <PageHeader
        eyebrow="Counsellor workspace"
        title="Missing Documents"
        subtitle="Track and resolve document gaps before application deadlines"
        icon={AlertTriangle}
        tone="indigo"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={FileWarning}
          tone="rose"
          label="Learners Affected"
          value={isLoading ? "—" : learnersAffected}
          hint="With pending docs"
        />
        <StatCard
          icon={AlertTriangle}
          tone="orange"
          label="Pending Applications"
          value={isLoading ? "—" : items.length}
          hint="Awaiting documents"
        />
      </div>

      {!isLoading && !isError && items.length > 0 && (
        <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 ring-1 ring-rose-200">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <p className="flex-1 text-sm font-semibold text-rose-900">
            {learnersAffected} learner{learnersAffected === 1 ? "" : "s"} require attention before
            their application deadlines
          </p>
        </div>
      )}

      <div className="mt-6">
        <Panel
          title="Learners with pending documents"
          description={
            isLoading ? "Loading…" : `${items.length} application${items.length === 1 ? "" : "s"}`
          }
          icon={FileWarning}
          tone="indigo"
          flush
        >
          {isLoading && <TableSkeleton />}
          {isError && (
            <div className="px-5 py-16 text-center text-sm text-rose-600">
              Couldn't load missing documents.
            </div>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              No pending documents. All learners are up to date.
            </div>
          )}
          {!isLoading && !isError && items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Learner</th>
                    <th className="px-5 py-3 text-left font-semibold">University</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((i, idx) => (
                    <tr
                      key={`${i.studentId}-${i.universityId}-${idx}`}
                      className="border-t border-border/50 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <IconBadge icon={FileWarning} tone="rose" size="sm" />
                          <span className="font-medium">{i.fullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{i.universityId}</td>
                      <td className="px-5 py-3.5">
                        <StatusPill tone={statusTone(i.status)}>{statusLabel(i.status)}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!isLoading && !isError && items.length > 0 && (
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
