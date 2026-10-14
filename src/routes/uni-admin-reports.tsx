import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UniversityAdminShell } from "@/components/UniversityAdminShell";
import { BarChart3, TrendingUp } from "lucide-react";
import { PageHeader, StatCard, Panel, BarRow, type Tone } from "@/components/dashboard/ui";
import { StatCardsSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";

export const Route = createFileRoute("/uni-admin-reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics · Varsity Hub" }] }),
  component: UniAdminReports,
});

const tones: Tone[] = ["blue", "indigo", "violet", "teal", "emerald", "amber", "sky", "fuchsia"];

function titleCase(s: string) {
  return s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Try to pull a {label, value} pair out of an arbitrary object in a report array. */
function toLabelValue(item: unknown): { label: string; value: number } | null {
  if (!isRecord(item)) return null;
  const labelKeys = ["status", "programme", "programmeName", "label", "name", "province", "month", "category", "key"];
  const valueKeys = ["count", "total", "value", "amount", "number"];
  let label: string | null = null;
  for (const k of labelKeys) {
    if (typeof item[k] === "string" || typeof item[k] === "number") {
      label = String(item[k]);
      break;
    }
  }
  let value: number | null = null;
  for (const k of valueKeys) {
    if (typeof item[k] === "number") {
      value = item[k] as number;
      break;
    }
  }
  if (label == null && value == null) return null;
  return { label: label ?? "—", value: value ?? 0 };
}

function UniAdminReports() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["uni-admin", "reports"],
    queryFn: () => api.get<unknown>("/api/uni-admin/reports"),
  });

  const entries = isRecord(data) ? Object.entries(data) : [];
  const numeric = entries.filter(([, v]) => typeof v === "number") as [string, number][];
  const arrays = entries.filter(([, v]) => Array.isArray(v)) as [string, unknown[]][];

  return (
    <UniversityAdminShell>
      <PageHeader
        eyebrow="Insights"
        title="Reports & Analytics"
        subtitle="Application cycle metrics and breakdowns."
        icon={BarChart3}
        tone="blue"
      />

      {isLoading && <StatCardsSkeleton />}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load reports.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {numeric.length > 0 && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {numeric.map(([key, value], i) => (
                <StatCard
                  key={key}
                  icon={TrendingUp}
                  label={titleCase(key)}
                  value={value}
                  tone={tones[i % tones.length]}
                />
              ))}
            </div>
          )}

          {arrays.length > 0 && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {arrays.map(([key, list]) => {
                const points = list.map(toLabelValue).filter((p): p is { label: string; value: number } => p !== null);
                const max = Math.max(1, ...points.map((p) => p.value));
                return (
                  <Panel key={key} title={titleCase(key)} icon={BarChart3} tone="blue">
                    {points.length > 0 ? (
                      <div className="space-y-3.5">
                        {points.map((p, i) => (
                          <BarRow
                            key={`${p.label}-${i}`}
                            label={p.label}
                            value={p.value}
                            max={max}
                            tone={tones[i % tones.length]}
                            labelWidth="w-32"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-sm text-muted-foreground">No data for this section.</div>
                    )}
                  </Panel>
                );
              })}
            </div>
          )}

          {numeric.length === 0 && arrays.length === 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
              No report data available.
            </div>
          )}
        </>
      )}
    </UniversityAdminShell>
  );
}
