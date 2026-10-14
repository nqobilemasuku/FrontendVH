import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import { FileBarChart, BarChart3 } from "lucide-react";
import { PageHeader, Panel, StatCard, BarRow, table } from "@/components/dashboard/ui";
import { StatCardsSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics · Varsity Hub" }] }),
  component: AdminReports,
});

/** Reports shape is not fixed in the schema, so render defensively. */
type ReportData = Record<string, unknown>;

function humanize(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

/** Try to reduce an array item into a { label, value } pair for bar charts. */
function asLabelValue(item: unknown): { label: string; value: number } | null {
  if (item == null || typeof item !== "object") return null;
  const obj = item as Record<string, unknown>;
  const labelKey = Object.keys(obj).find(
    (k) => typeof obj[k] === "string" || /name|label|title|key|province|university|month/i.test(k),
  );
  const valueEntry = Object.entries(obj).find(([, v]) => toNumber(v) != null);
  if (!labelKey || !valueEntry) return null;
  return { label: String(obj[labelKey]), value: toNumber(valueEntry[1]) ?? 0 };
}

function ArrayPanel({ title, rows }: { title: string; rows: unknown[] }) {
  const barData = rows.map(asLabelValue);
  const allBars = barData.every((b) => b != null) && barData.length > 0;

  if (allBars) {
    const bars = barData as { label: string; value: number }[];
    const max = Math.max(...bars.map((b) => b.value), 1);
    return (
      <Panel title={title} icon={BarChart3} tone="fuchsia">
        <div className="space-y-3">
          {bars.map((b, i) => (
            <BarRow
              key={`${b.label}-${i}`}
              label={b.label}
              value={b.value}
              max={max}
              tone="fuchsia"
              valueLabel={b.value.toLocaleString()}
              labelWidth="w-40"
            />
          ))}
        </div>
      </Panel>
    );
  }

  // Object rows → small table; primitive rows → single column
  const objectRows = rows.filter((r) => r != null && typeof r === "object") as Record<
    string,
    unknown
  >[];
  if (objectRows.length > 0) {
    const columns = Array.from(new Set(objectRows.flatMap((r) => Object.keys(r))));
    return (
      <Panel title={title} icon={BarChart3} tone="fuchsia" flush>
        <div className="overflow-x-auto">
          <table className={table.el}>
            <thead className={table.thead}>
              <tr>
                {columns.map((c) => (
                  <th key={c} className={table.th}>
                    {humanize(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {objectRows.map((r, i) => (
                <tr key={i} className={table.row}>
                  {columns.map((c) => (
                    <td key={c} className={table.td}>
                      {r[c] == null ? "—" : String(r[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title={title} icon={BarChart3} tone="fuchsia">
      <ul className="space-y-1 text-sm">
        {rows.map((r, i) => (
          <li key={i} className="text-foreground">
            {String(r)}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function AdminReports() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => api.get<ReportData>("/api/admin/reports"),
  });

  const entries = data && typeof data === "object" ? Object.entries(data) : [];
  const numericEntries = entries.filter(([, v]) => toNumber(v) != null);
  const arrayEntries = entries.filter(([, v]) => Array.isArray(v)) as [string, unknown[]][];
  const objectEntries = entries.filter(
    ([, v]) => v != null && typeof v === "object" && !Array.isArray(v),
  ) as [string, Record<string, unknown>][];

  return (
    <SuperAdminShell>
      <PageHeader
        eyebrow="National Administration"
        title="Reports & Analytics"
        subtitle="National platform statistics and trends."
        icon={FileBarChart}
        tone="fuchsia"
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
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {numericEntries.map(([k, v]) => (
                <StatCard
                  key={k}
                  icon={FileBarChart}
                  label={humanize(k)}
                  value={(toNumber(v) ?? 0).toLocaleString()}
                  tone="fuchsia"
                />
              ))}
            </div>
          )}

          {(arrayEntries.length > 0 || objectEntries.length > 0) && (
            <div className={cn("grid gap-6 lg:grid-cols-2", numericEntries.length > 0 && "mt-6")}>
              {arrayEntries.map(([k, v]) => (
                <ArrayPanel key={k} title={humanize(k)} rows={v} />
              ))}
              {objectEntries.map(([k, v]) => {
                const nums = Object.entries(v).filter(([, val]) => toNumber(val) != null);
                if (nums.length === 0) return null;
                const max = Math.max(...nums.map(([, val]) => toNumber(val) ?? 0), 1);
                return (
                  <Panel key={k} title={humanize(k)} icon={BarChart3} tone="fuchsia">
                    <div className="space-y-3">
                      {nums.map(([nk, nv]) => (
                        <BarRow
                          key={nk}
                          label={humanize(nk)}
                          value={toNumber(nv) ?? 0}
                          max={max}
                          tone="fuchsia"
                          valueLabel={(toNumber(nv) ?? 0).toLocaleString()}
                          labelWidth="w-40"
                        />
                      ))}
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}

          {entries.length === 0 && (
            <div className="rounded-2xl border border-border/70 bg-card p-12 text-center text-sm text-muted-foreground">
              No report data available.
            </div>
          )}
        </>
      )}
    </SuperAdminShell>
  );
}
