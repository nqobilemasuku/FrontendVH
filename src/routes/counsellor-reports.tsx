import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CounsellorShell } from "@/components/CounsellorShell";
import { BarChart3, Hash, Table2 } from "lucide-react";
import { PageHeader, StatCard, Panel } from "@/components/dashboard/ui";
import { StatCardsSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";

export const Route = createFileRoute("/counsellor-reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics · Varsity Hub" }] }),
  component: CounsellorReports,
});

function humanize(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function CounsellorReports() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["counsellor-reports"],
    queryFn: () => api.get<Record<string, unknown>>("/api/counsellor/reports"),
  });

  const report = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  const entries = Object.entries(report);
  const numericEntries = entries.filter(([, v]) => typeof v === "number");
  const arrayEntries = entries.filter(([, v]) => Array.isArray(v)) as [string, unknown[]][];

  return (
    <CounsellorShell>
      <PageHeader
        eyebrow="Counsellor workspace"
        title="Reports & Analytics"
        subtitle="School wide performance reports"
        icon={BarChart3}
        tone="indigo"
      />

      {isLoading && <StatCardsSkeleton />}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load reports.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {numericEntries.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {numericEntries.map(([key, value]) => (
                <StatCard
                  key={key}
                  icon={Hash}
                  tone="indigo"
                  label={humanize(key)}
                  value={value as number}
                />
              ))}
            </div>
          )}

          {arrayEntries.length > 0 && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {arrayEntries.map(([key, rows]) => {
                const columns =
                  rows.length && rows[0] && typeof rows[0] === "object" && !Array.isArray(rows[0])
                    ? Object.keys(rows[0] as Record<string, unknown>)
                    : [];
                return (
                  <Panel
                    key={key}
                    title={humanize(key)}
                    description={`${rows.length} row${rows.length === 1 ? "" : "s"}`}
                    icon={Table2}
                    tone="indigo"
                    flush
                  >
                    {rows.length === 0 ? (
                      <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No data.
                      </div>
                    ) : columns.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                            <tr>
                              {columns.map((c) => (
                                <th key={c} className="px-5 py-3 text-left font-semibold">
                                  {humanize(c)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, i) => (
                              <tr
                                key={i}
                                className="border-t border-border/50 transition-colors hover:bg-muted/30"
                              >
                                {columns.map((c) => {
                                  const cell = (row as Record<string, unknown>)?.[c];
                                  return (
                                    <td key={c} className="px-5 py-3.5">
                                      {cell == null
                                        ? "—"
                                        : typeof cell === "object"
                                          ? JSON.stringify(cell)
                                          : String(cell)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <ul className="divide-y divide-border/50">
                        {rows.map((row, i) => (
                          <li key={i} className="px-5 py-3.5 text-sm">
                            {String(row)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Panel>
                );
              })}
            </div>
          )}

          {numericEntries.length === 0 && arrayEntries.length === 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
              No report data available yet.
            </div>
          )}
        </>
      )}
    </CounsellorShell>
  );
}
