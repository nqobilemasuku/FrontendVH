/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EmployerShell } from "@/components/EmployerShell";
import { Users, Briefcase, ArrowRight } from "lucide-react";
import { PageHeader, Panel, StatusPill, btn, type Tone } from "@/components/dashboard/ui";
import { CardGridSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { type EmployerJob, jobTypeLabels, jobTypeTone, JobApplicantsModal } from "@/components/employer/jobs-shared";

export const Route = createFileRoute("/employer-applicants")({
  head: () => ({ meta: [{ title: "Applicants · Varsity Hub" }] }),
  component: EmployerApplicants,
});

function EmployerApplicants() {
  const [selected, setSelected] = useState<EmployerJob | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["employer-jobs"],
    queryFn: () => api.get<EmployerJob[]>("/api/employer/jobs"),
  });
  const jobs = data ?? [];
  const totalApplicants = jobs.reduce((a, j) => a + (j.applicantCount || 0), 0);

  return (
    <EmployerShell>
      <PageHeader
        eyebrow="Recruiting"
        title="Applicants"
        subtitle="Review and progress the students who applied to your jobs."
        icon={Users}
        tone="indigo"
      />

      {isLoading && <CardGridSkeleton columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />}
      {isError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">Couldn't load your jobs.</div>}

      {!isLoading && !isError && jobs.length === 0 && (
        <Panel>
          <div className="py-12 text-center">
            <Briefcase className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">You haven't posted any jobs yet.</p>
            <Link to={"/employer-jobs" as string} className={cn(btn.primary, "mt-4 inline-flex")}>
              Post a job <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Panel>
      )}

      {!isLoading && !isError && jobs.length > 0 && (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{totalApplicants}</span> applicant{totalApplicants === 1 ? "" : "s"} across{" "}
            <span className="font-semibold text-foreground">{jobs.length}</span> job{jobs.length === 1 ? "" : "s"}.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j) => (
              <button
                key={j.id}
                onClick={() => setSelected(j)}
                className="flex flex-col items-start gap-3 rounded-2xl border border-border/70 bg-card p-5 text-left shadow-(--shadow-card) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-md)"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <StatusPill tone={jobTypeTone(j.type) as Tone} dot={false}>{jobTypeLabels[j.type] ?? j.type}</StatusPill>
                  <StatusPill tone={j.isActive ? "emerald" : "rose"}>{j.isActive ? "Active" : "Inactive"}</StatusPill>
                </div>
                <h3 className="text-base font-semibold leading-snug">{j.title}</h3>
                <div className="mt-auto flex w-full items-center justify-between border-t border-border/50 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                    <Users className="h-4 w-4" /> {j.applicantCount} applicant{j.applicantCount === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">Review <ArrowRight className="h-3.5 w-3.5" /></span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {selected && <JobApplicantsModal job={selected} scope="employer" onClose={() => setSelected(null)} />}
    </EmployerShell>
  );
}
