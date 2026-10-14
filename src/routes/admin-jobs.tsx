/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import { Briefcase, Plus, Pencil, Trash2, X, Loader2, Power, Users } from "lucide-react";
import { PageHeader, Panel, StatusPill, btn, table } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-jobs")({
  head: () => ({ meta: [{ title: "Jobs · Varsity Hub" }] }),
  component: AdminJobs,
});

type JobType = "internship" | "graduate_programme" | "part_time";
type JobAppStatus = "applied" | "viewed" | "interview" | "offer" | "rejected" | "withdrawn";

type AdminJob = {
  id: string;
  title: string;
  company: string;
  type: JobType;
  location: string | null;
  salaryText: string | null;
  description: string | null;
  tags: string[];
  isRemote: boolean;
  closesOn: string | null;
  isActive: boolean;
  applicantCount: number;
};

type JobApplicant = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  cvDocumentId: string | null;
  status: JobAppStatus;
  appliedAt: string;
};

const jobTypeLabels: Record<JobType, string> = {
  internship: "Internship",
  graduate_programme: "Graduate Programme",
  part_time: "Part-time",
};
const jobTypes = Object.keys(jobTypeLabels) as JobType[];

const appStatusLabels: Record<JobAppStatus, string> = {
  applied: "Applied",
  viewed: "Viewed",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};
const appStatuses = Object.keys(appStatusLabels) as JobAppStatus[];

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });

const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25";

type FormState = {
  title: string;
  company: string;
  type: JobType;
  location: string;
  salaryText: string;
  closesOn: string;
  isRemote: boolean;
  tags: string;
  description: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  title: "",
  company: "",
  type: "internship",
  location: "",
  salaryText: "",
  closesOn: "",
  isRemote: false,
  tags: "",
  description: "",
  isActive: true,
};

const parseTags = (s: string) =>
  s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

function AdminJobs() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminJob | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [applicantsFor, setApplicantsFor] = useState<AdminJob | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: () => api.get<AdminJob[]>("/api/admin/jobs"),
  });
  const jobs = data ?? [];
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(jobs, 10);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-jobs"] });

  const createMut = useMutation({
    mutationFn: (f: FormState) =>
      api.post("/api/admin/jobs", {
        title: f.title,
        company: f.company || null,
        type: f.type,
        location: f.location || null,
        salaryText: f.salaryText || null,
        description: f.description || null,
        tags: parseTags(f.tags),
        isRemote: f.isRemote,
        closesOn: f.closesOn || null,
      }),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/api/admin/jobs/${id}`, body),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/api/admin/jobs/${id}`, { isActive }),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/api/admin/jobs/${id}`),
    onSuccess: invalidate,
  });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }
  function openEdit(j: AdminJob) {
    setEditing(j);
    setForm({
      title: j.title,
      company: j.company,
      type: j.type,
      location: j.location ?? "",
      salaryText: j.salaryText ?? "",
      closesOn: j.closesOn ? j.closesOn.slice(0, 10) : "",
      isRemote: j.isRemote,
      tags: j.tags.join(", "),
      description: j.description ?? "",
      isActive: j.isActive,
    });
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }
  function submitForm() {
    if (editing) {
      updateMut.mutate({
        id: editing.id,
        body: {
          title: form.title,
          company: form.company || null,
          type: form.type,
          location: form.location || null,
          salaryText: form.salaryText || null,
          description: form.description || null,
          tags: parseTags(form.tags),
          isRemote: form.isRemote,
          closesOn: form.closesOn || null,
          isActive: form.isActive,
        },
      });
    } else {
      createMut.mutate(form);
    }
  }
  const saving = createMut.isPending || updateMut.isPending;

  return (
    <SuperAdminShell>
      <PageHeader
        eyebrow="National Administration"
        title="Jobs"
        subtitle="Manage internships, graduate programmes and part-time roles across the platform."
        icon={Briefcase}
        tone="fuchsia"
        actions={
          <button className={btn.primary} onClick={openAdd}>
            <Plus className="h-4 w-4" />
            New job
          </button>
        }
      />

      <Panel flush>
        {isLoading && <TableSkeleton cols={6} />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">Couldn't load jobs.</div>
        )}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto">
              <table className={table.el}>
                <thead className={table.thead}>
                  <tr>
                    <th className={table.th}>Title</th>
                    <th className={table.th}>Company</th>
                    <th className={table.th}>Type</th>
                    <th className={cn(table.th, "text-center")}>Applicants</th>
                    <th className={table.th}>Status</th>
                    <th className={cn(table.th, "text-right")}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((j) => (
                    <tr key={j.id} className={table.row}>
                      <td className={cn(table.td, "font-medium")}>{j.title}</td>
                      <td className={cn(table.td, "text-muted-foreground")}>{j.company}</td>
                      <td className={table.td}>
                        <StatusPill tone="indigo" dot={false}>
                          {jobTypeLabels[j.type]}
                        </StatusPill>
                      </td>
                      <td className={cn(table.td, "text-center font-semibold tabular-nums")}>
                        {j.applicantCount}
                      </td>
                      <td className={table.td}>
                        <StatusPill tone={j.isActive ? "emerald" : "rose"}>
                          {j.isActive ? "Active" : "Inactive"}
                        </StatusPill>
                      </td>
                      <td className={cn(table.td, "text-right")}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title={j.isActive ? "Deactivate" : "Activate"}
                            disabled={toggleMut.isPending}
                            onClick={() => toggleMut.mutate({ id: j.id, isActive: !j.isActive })}
                            className={cn(
                              "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50",
                              j.isActive
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50",
                            )}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="View applicants"
                            onClick={() => setApplicantsFor(j)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fuchsia-600 transition-colors hover:bg-fuchsia-50"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => openEdit(j)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            disabled={deleteMut.isPending}
                            onClick={() => {
                              if (confirm(`Delete ${j.title}?`)) deleteMut.mutate(j.id);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">
                        No jobs yet. Post your first opening to start receiving applications.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} setPage={setPage} noun="jobs" />
          </>
        )}
      </Panel>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeForm}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
              <h2 className="text-lg font-bold">{editing ? "Edit job" : "New job"}</h2>
              <button onClick={closeForm} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Graduate Software Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Company</label>
                  <input className={inputCls} value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as JobType }))}>
                    {jobTypes.map((t) => (
                      <option key={t} value={t}>{jobTypeLabels[t]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Location</label>
                  <input className={inputCls} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Cape Town" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Salary</label>
                  <input className={inputCls} value={form.salaryText} onChange={(e) => setForm((f) => ({ ...f, salaryText: e.target.value }))} placeholder="R25 000 / month" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Closes on</label>
                <input type="date" className={inputCls} value={form.closesOn} onChange={(e) => setForm((f) => ({ ...f, closesOn: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tags (comma-separated)</label>
                <input className={inputCls} value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="react, typescript, remote-friendly" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea rows={3} className={cn(inputCls, "resize-none")} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" checked={form.isRemote} onChange={(e) => setForm((f) => ({ ...f, isRemote: e.target.checked }))} className="h-4 w-4 rounded border-border text-fuchsia-600 focus:ring-fuchsia-500/30" />
                <span className="font-medium">Remote</span>
              </label>
              {editing && (
                <label className="flex items-center gap-2.5 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-border text-fuchsia-600 focus:ring-fuchsia-500/30" />
                  <span className="font-medium">Active</span>
                </label>
              )}
              {(createMut.isError || updateMut.isError) && (
                <p className="text-sm text-rose-600">Couldn't save the job. Please try again.</p>
              )}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border/60 bg-card px-6 py-4">
              <button className={btn.outline} onClick={closeForm}>Cancel</button>
              <button className={btn.primary} disabled={saving || !form.title} onClick={submitForm}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create job"}
              </button>
            </div>
          </div>
        </div>
      )}

      {applicantsFor && (
        <ApplicantsModal job={applicantsFor} onClose={() => setApplicantsFor(null)} />
      )}
    </SuperAdminShell>
  );
}

function ApplicantsModal({ job, onClose }: { job: AdminJob; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-job-applicants", job.id],
    queryFn: () => api.get<JobApplicant[]>(`/api/admin/jobs/${job.id}/applicants`),
  });
  const applicants = data ?? [];

  const statusMut = useMutation({
    mutationFn: ({ applicantId, status }: { applicantId: string; status: JobAppStatus }) =>
      api.patch(`/api/admin/job-applications/${applicantId}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-job-applicants", job.id] }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">Applicants</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{job.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">
          {isLoading && <TableSkeleton cols={4} />}
          {isError && (
            <div className="px-5 py-12 text-center text-sm text-rose-600">Couldn't load applicants.</div>
          )}
          {!isLoading && !isError && applicants.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">No applicants yet.</div>
          )}
          {!isLoading && !isError && applicants.length > 0 && (
            <div className="overflow-x-auto">
              <table className={table.el}>
                <thead className={table.thead}>
                  <tr>
                    <th className={table.th}>Student</th>
                    <th className={table.th}>Email</th>
                    <th className={table.th}>Applied</th>
                    <th className={table.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((a) => (
                    <tr key={a.id} className={table.row}>
                      <td className={cn(table.td, "font-medium")}>{a.studentName}</td>
                      <td className={cn(table.td, "text-muted-foreground")}>{a.studentEmail}</td>
                      <td className={cn(table.td, "text-muted-foreground")}>{dateFmt(a.appliedAt)}</td>
                      <td className={table.td}>
                        <select
                          className={inputCls}
                          value={a.status}
                          disabled={statusMut.isPending}
                          onChange={(e) => statusMut.mutate({ applicantId: a.id, status: e.target.value as JobAppStatus })}
                        >
                          {appStatuses.map((s) => (
                            <option key={s} value={s}>{appStatusLabels[s]}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
