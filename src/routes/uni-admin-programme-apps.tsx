import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UniversityAdminShell } from "@/components/UniversityAdminShell";
import { BookOpen } from "lucide-react";
import { PageHeader, Panel, BarRow, type Tone } from "@/components/dashboard/ui";
import { PanelSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";

export const Route = createFileRoute("/uni-admin-programme-apps")({
  head: () => ({ meta: [{ title: "Applications by Programme · Varsity Hub" }] }),
  component: UniAdminProgrammeApps,
});

type ProgrammeAppCount = {
  programmeId: string;
  programme: string;
  count: number;
};

const tones: Tone[] = ["blue", "indigo", "violet", "teal", "emerald", "amber", "sky", "fuchsia"];

function UniAdminProgrammeApps() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["uni-admin", "programme-apps"],
    queryFn: () => api.get<ProgrammeAppCount[]>("/api/uni-admin/programme-apps"),
  });
  const rows = data ?? [];
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <UniversityAdminShell>
      <PageHeader
        eyebrow="Admissions"
        title="Applications by Programme"
        subtitle="Overview of applications grouped by academic programme."
        icon={BookOpen}
        tone="blue"
      />

      <Panel title="Applications received" icon={BookOpen} tone="blue" description="Per programme">
        {isLoading && <PanelSkeleton lines={6} />}
        {isError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
            Couldn't load programme data.
          </div>
        )}
        {!isLoading && !isError && (
          <div className="space-y-3.5">
            {rows.map((r, i) => (
              <BarRow
                key={r.programmeId}
                label={r.programme}
                value={r.count}
                max={max}
                tone={tones[i % tones.length]}
                labelWidth="w-48"
              />
            ))}
            {rows.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">No programme data available.</div>
            )}
          </div>
        )}
      </Panel>
    </UniversityAdminShell>
  );
}
