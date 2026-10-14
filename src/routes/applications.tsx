/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentShell } from "@/components/StudentShell";
import {
  FileText,
  ChevronRight,
  ClipboardCheck,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  StatusPill,
  IconBadge,
  table,
  btn,
  type Tone,
} from "@/components/dashboard/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePagination, Pagination } from "@/components/dashboard/pagination";

export const Route = createFileRoute("/applications")({
  head: () => ({ meta: [{ title: "Applications · Varsity Hub" }] }),
  component: Applications,
});

type ApplicationSummary = {
  id: string;
  studentNumber?: string | null;
  universityName: string;
  programmeName: string;
  status: string;
  createdAt: string;
};

const statusMeta: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "slate" },
  submitted: { label: "Submitted", tone: "blue" },
  under_review: { label: "Under Review", tone: "amber" },
  pending_documents: { label: "Pending Documents", tone: "orange" },
  approved: { label: "Approved", tone: "emerald" },
  waitlisted: { label: "Waitlisted", tone: "violet" },
  rejected: { label: "Rejected", tone: "rose" },
  withdrawn: { label: "Withdrawn", tone: "slate" },
};
function meta(status: string) {
  return statusMeta[status] ?? { label: status, tone: "slate" as Tone };
}
function initials(name: string) {
  return (name || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function shortId(id?: string | null) {
  return id ? id.slice(0, 8).toUpperCase() : "—";
}

const filters = [
  { id: "all", label: "All" },
  { id: "under_review", label: "Under Review" },
  { id: "approved", label: "Approved" },
  { id: "pending_documents", label: "Pending" },
  { id: "rejected", label: "Rejected" },
];

function Applications() {
  const [active, setActive] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["applications"],
    queryFn: () => api.get<ApplicationSummary[]>("/api/Applications"),
  });

  const all = data ?? [];
  const countFor = (id: string) => (id === "all" ? all.length : all.filter((a) => a.status === id).length);
  const rows = active === "all" ? all : all.filter((a) => a.status === active);
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(rows, 10);

  return (
    <StudentShell>
      <PageHeader
        icon={FileText}
        eyebrow="Applications"
        title="Applications"
        subtitle="Track all your university applications in one place."
        actions={
          <Link to={"/application-form" as string} className={btn.primary}>
            <Plus className="h-4 w-4" /> New Application
          </Link>
        }
      />

      {/* Filter tabs */}
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
        {filters.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active === t.id
                ? "bg-card text-foreground shadow-(--shadow-xs)"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label} ({countFor(t.id)})
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading applications…
        </div>
      )}
      {isError && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load your applications.
        </div>
      )}

      {!isLoading && !isError && (
        <Panel className="mt-6" flush>
          <div className="overflow-x-auto">
            <table className={table.el}>
              <thead className={table.thead}>
                <tr>
                  <th className={table.th}>Application</th>
                  <th className={table.th}>University</th>
                  <th className={table.th}>Programme</th>
                  <th className={table.th}>Status</th>
                  <th className={table.th}>Submitted On</th>
                  <th className={cn(table.th, "text-right")} />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => {
                  const m = meta(r.status);
                  return (
                    <tr key={r.id} className={cn(table.row, "cursor-pointer")}>
                      <td className={cn(table.td, "font-semibold tabular-nums text-muted-foreground")}>
                        {r.studentNumber ?? shortId(r.id)}
                      </td>
                      <td className={table.td}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-brand-cyan text-[11px] font-bold text-white">
                            {initials(r.universityName)}
                          </div>
                          <span className="font-medium">{r.universityName}</span>
                        </div>
                      </td>
                      <td className={cn(table.td, "text-muted-foreground")}>{r.programmeName}</td>
                      <td className={table.td}>
                        <StatusPill tone={m.tone}>{m.label}</StatusPill>
                      </td>
                      <td className={cn(table.td, "text-muted-foreground")}>
                        {new Date(r.createdAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className={cn(table.td, "text-right")}>
                        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-sm text-muted-foreground">
                      {all.length === 0 ? "You haven't started any applications yet." : "No applications in this category."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {!isLoading && !isError && (
        <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} setPage={setPage} noun="applications" />
      )}

      {/* Tip banner */}
      <Panel className="mt-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <IconBadge icon={ClipboardCheck} tone="primary" size="lg" />
            <div>
              <h4 className="font-semibold">Application Tips</h4>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Make sure all your documents are up to date and your profile is 100% complete.
              </p>
            </div>
          </div>
          <Link to={"/documents" as string} className={cn(btn.outline, "shrink-0")}>
            View Documents <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Panel>
    </StudentShell>
  );
}
