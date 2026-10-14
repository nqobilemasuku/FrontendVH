import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import { ScrollText } from "lucide-react";
import { PageHeader, Panel, table } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs · Varsity Hub" }] }),
  component: AdminAuditLogs,
});

type AuditLogDto = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: string;
  createdAt: string;
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function prettyMeta(raw: string) {
  if (!raw) return "";
  try {
    return JSON.stringify(JSON.parse(raw));
  } catch {
    return raw;
  }
}

const selectCls =
  "rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25";

function AdminAuditLogs() {
  const [entity, setEntity] = useState("");
  const [actor, setActor] = useState("");
  const [limit, setLimit] = useState("100");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-audit-logs", entity, actor, limit],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (entity) qs.set("entity", entity);
      if (actor) qs.set("actor", actor);
      if (limit) qs.set("limit", limit);
      return api.get<AuditLogDto[]>(`/api/admin/audit-logs?${qs.toString()}`);
    },
  });

  const logs = [...(data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(logs, 10);

  return (
    <SuperAdminShell>
      <PageHeader
        eyebrow="National Administration"
        title="Audit Logs"
        subtitle="Complete system audit trail for all platform activity."
        icon={ScrollText}
        tone="fuchsia"
      />

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-border/70 bg-card p-4 shadow-(--shadow-card)">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className={cn(selectCls, "min-w-48 flex-1")}
            placeholder="Filter by actor ID…"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
          <input
            className={cn(selectCls, "min-w-48 flex-1")}
            placeholder="Filter by entity type…"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          />
          <select className={selectCls} value={limit} onChange={(e) => setLimit(e.target.value)}>
            <option value="50">Last 50</option>
            <option value="100">Last 100</option>
            <option value="250">Last 250</option>
            <option value="500">Last 500</option>
          </select>
        </div>
      </div>

      <Panel flush>
        {isLoading && <TableSkeleton />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">
            Couldn't load audit logs.
          </div>
        )}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto">
            <table className={table.el}>
              <thead className={table.thead}>
                <tr>
                  <th className={table.th}>Timestamp</th>
                  <th className={table.th}>Actor</th>
                  <th className={table.th}>Action</th>
                  <th className={table.th}>Entity</th>
                  <th className={table.th}>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((l) => (
                  <tr key={l.id} className={table.row}>
                    <td
                      className={cn(
                        table.td,
                        "whitespace-nowrap font-mono text-[11px] text-muted-foreground",
                      )}
                    >
                      {fmtTime(l.createdAt)}
                    </td>
                    <td className={cn(table.td, "font-mono text-[11px] text-muted-foreground")}>
                      {l.actorId ?? "System"}
                    </td>
                    <td className={table.td}>
                      <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                        {l.action}
                      </span>
                    </td>
                    <td className={cn(table.td, "text-muted-foreground")}>
                      {l.entityType ? (
                        <>
                          {l.entityType}
                          {l.entityId && (
                            <span className="ml-1 font-mono text-[11px]">#{l.entityId}</span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td
                      className={cn(
                        table.td,
                        "max-w-xs truncate font-mono text-[11px] text-muted-foreground",
                      )}
                    >
                      {prettyMeta(l.metadata) || "—"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-sm text-muted-foreground"
                    >
                      No audit log entries found.
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
              noun="entries"
            />
          </>
        )}
      </Panel>
    </SuperAdminShell>
  );
}
