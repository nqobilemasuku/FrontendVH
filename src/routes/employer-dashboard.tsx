/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmployerShell } from "@/components/EmployerShell";
import { Briefcase, Users, CheckCircle2, Plus, ArrowRight, Building2 } from "lucide-react";
import { PageHeader, StatCard, Panel, StatusPill, btn, type Tone } from "@/components/dashboard/ui";
import { StatCardsSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { type EmployerJob, jobTypeLabels, jobTypeTone } from "@/components/employer/jobs-shared";

export const Route = createFileRoute("/employer-dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Varsity Hub" }] }),
  component: EmployerDashboard,
});

type EmployerProfile = { companyName: string; isVerified: boolean };

function EmployerDashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["employer-profile"],
    queryFn: () => api.get<EmployerProfile>("/api/employer/profile"),
  });
  const { data, isLoading, isError } = useQuery({
    queryKey: ["employer-jobs"],
    queryFn: () => api.get<EmployerJob[]>("/api/employer/jobs"),
  });

  const jobs = data ?? [];
  const activeJobs = jobs.filter((j) => j.isActive).length;
  const totalApplicants = jobs.reduce((a, j) => a + (j.applicantCount || 0), 0);
  const recent = [...jobs].slice(0, 5);
  const company = profile?.companyName || user?.fullName || "your company";

  return (
    <EmployerShell>
      <PageHeader
        eyebrow="Overview"
        title="Employer Dashboard"
        subtitle={`Recruiting for ${company}.`}
        icon={Building2}
        tone="indigo"
        actions={
          <Link to={"/employer-jobs" as string} className={btn.primary}>
            <Plus className="h-4 w-4" /> New job
          </Link>
        }
      />

      {isLoading && <StatCardsSkeleton count={3} />}
      {isError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">Couldn't load your dashboard.</div>}

      {!isLoading && !isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Briefcase} tone="indigo" label="Jobs posted" value={jobs.length} hint={`${activeJobs} active`} />
            <StatCard icon={Users} tone="primary" label="Total applicants" value={totalApplicants} hint="Across all jobs" />
            <StatCard icon={CheckCircle2} tone={profile?.isVerified ? "emerald" : "amber"} label="Account" value={<span className="text-2xl">{profile?.isVerified ? "Verified" : "Pending"}</span>} hint="Verification status" />
          </div>

          <Panel
            className="mt-6"
            flush
            icon={Briefcase}
            title="Recent jobs"
            description="Your latest postings and their applicant counts"
            action={<Link to={"/employer-jobs" as string} className="text-sm font-medium text-indigo-600 hover:underline">View all</Link>}
          >
            <ul className="divide-y divide-border/60">
              {recent.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{j.title}</span>
                      <StatusPill tone={jobTypeTone(j.type) as Tone} dot={false}>{jobTypeLabels[j.type] ?? j.type}</StatusPill>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{j.location ?? (j.isRemote ? "Remote" : "—")}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600"><Users className="h-3.5 w-3.5" /> {j.applicantCount}</span>
                    <StatusPill tone={j.isActive ? "emerald" : "rose"}>{j.isActive ? "Active" : "Inactive"}</StatusPill>
                  </div>
                </li>
              ))}
              {recent.length === 0 && (
                <li className="px-5 py-12 text-center">
                  <p className="text-sm text-muted-foreground">No jobs yet.</p>
                  <Link to={"/employer-jobs" as string} className={cn(btn.primary, "mt-4 inline-flex")}>
                    Post your first job <ArrowRight className="h-4 w-4" />
                  </Link>
                </li>
              )}
            </ul>
          </Panel>
        </>
      )}
    </EmployerShell>
  );
}
