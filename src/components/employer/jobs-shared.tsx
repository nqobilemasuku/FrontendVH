/* eslint-disable prettier/prettier */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Users } from "lucide-react";
import { StatusPill, table, type Tone } from "@/components/dashboard/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25";

export type EmployerJob = {
  id: string;
  title: string;
  company: string;
  type: string;
  location: string | null;
  salaryText: string | null;
  description: string | null;
  tags: string[];
  isRemote: boolean;
  closesOn: string | null;
  isActive: boolean;
  applicantCount: number;
};

export type JobFormState = {
  title: string;
  type: string;
  location: string;
  salaryText: string;
  closesOn: string;
  isRemote: boolean;
  tags: string;
  description: string;
  isActive: boolean;
};
export const emptyJobForm: JobFormState = {
  title: "",
  type: "internship",
  location: "",
  salaryText: "",
  closesOn: "",
  isRemote: false,
  tags: "",
  description: "",
  isActive: true,
};

export const jobTypeLabels: Record<string, string> = {
  internship: "Internship",
  graduate_programme: "Graduate Programme",
  part_time: "Part-time",
};
export function jobTypeTone(t: string): Tone {
  return t === "internship" ? "indigo" : t === "graduate_programme" ? "primary" : "amber";
}

type JobApplicant = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  cvDocumentId: string | null;
  status: string;
  appliedAt: string;
};

const JOB_APP_STATUSES = ["applied", "viewed", "interview", "offer", "rejected", "withdrawn"] as const;
const statusLabels: Record<string, string> = {
  applied: "Applied", viewed: "Viewed", interview: "Interview", offer: "Offer", rejected: "Rejected", withdrawn: "Withdrawn",
};
export function jobAppTone(s: string): Tone {
  if (s === "offer") return "emerald";
  if (s === "interview") return "indigo";
  if (s === "rejected" || s === "withdrawn") return "rose";
  if (s === "viewed") return "amber";
  return "primary";
}
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });

/**
 * Applicants table for one job. `scope` selects the API namespace so the same
 * component serves both the employer portal and the super-admin screen.
 */
export function JobApplicantsModal({
  job,
  scope,
  onClose,
}: {
  job: { id: string; title: string };
  scope: "employer" | "admin";
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const key = ["job-applicants", scope, job.id];

  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () => api.get<JobApplicant[]>(`/api/${scope}/jobs/${job.id}/applicants`),
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/${scope}/job-applications/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const applicants = data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">Applicants</h2>
            <p className="text-xs text-muted-foreground">{job.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-2 sm:p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          )}
          {isError && <p className="py-16 text-center text-sm text-rose-600">Couldn't load applicants.</p>}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <table className={table.el}>
                <thead className={table.thead}>
                  <tr>
                    <th className={table.th}>Student</th>
                    <th className={table.th}>Applied</th>
                    <th className={table.th}>Status</th>
                    <th className={cn(table.th, "text-right")}>Set status</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((a) => (
                    <tr key={a.id} className={table.row}>
                      <td className={table.td}>
                        <div className="font-medium">{a.studentName}</div>
                        <div className="text-xs text-muted-foreground">{a.studentEmail}</div>
                      </td>
                      <td className={cn(table.td, "text-xs text-muted-foreground")}>{fmtDate(a.appliedAt)}</td>
                      <td className={table.td}>
                        <StatusPill tone={jobAppTone(a.status)} dot={false}>{statusLabels[a.status] ?? a.status}</StatusPill>
                      </td>
                      <td className={cn(table.td, "text-right")}>
                        <select
                          value={a.status}
                          disabled={setStatus.isPending}
                          onChange={(e) => setStatus.mutate({ id: a.id, status: e.target.value })}
                          className="rounded-lg border border-border/60 bg-background px-2 py-1 text-sm"
                        >
                          {JOB_APP_STATUSES.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {applicants.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-14 text-center text-sm text-muted-foreground">
                        <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
                        No applicants yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
