/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmployerShell } from "@/components/EmployerShell";
import { Briefcase, Plus, Pencil, X, Loader2, Power, Users, Trash2, Check } from "lucide-react";
import { PageHeader, Panel, StatusPill, btn, table, type Tone } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  type EmployerJob,
  type JobFormState,
  emptyJobForm,
  jobTypeLabels,
  jobTypeTone,
  JobApplicantsModal,
  inputCls,
} from "@/components/employer/jobs-shared";

export const Route = createFileRoute("/employer-jobs")({
  head: () => ({ meta: [{ title: "My Jobs · Varsity Hub" }] }),
  component: EmployerJobs,
});

function EmployerJobs() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmployerJob | null>(null);
  const [form, setForm] = useState<JobFormState>(emptyJobForm);
  const [confirmDelete, setConfirmDelete] = useState<EmployerJob | null>(null);
  const [applicantsFor, setApplicantsFor] = useState<EmployerJob | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["employer-jobs"],
    queryFn: () => api.get<EmployerJob[]>("/api/employer/jobs"),
  });
  const jobs = data ?? [];
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(jobs, 10);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["employer-jobs"] });

  function body(f: JobFormState) {
    return {
      title: f.title,
      type: f.type,
      location: f.location || null,
      salaryText: f.salaryText || null,
      closesOn: f.closesOn || null,
      isRemote: f.isRemote,
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
      description: f.description || null,
    };
  }

  const createMut = useMutation({
    // company is inferred by the backend from the employer profile.
    mutationFn: (f: JobFormState) => api.post("/api/employer/jobs", body(f)),
    onSuccess: () => { invalidate(); closeForm(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api.patch(`/api/employer/jobs/${id}`, patch),
    onSuccess: () => { invalidate(); closeForm(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/api/employer/jobs/${id}`),
    onSuccess: () => { invalidate(); setConfirmDelete(null); },
  });

  function openAdd() { setEditing(null); setForm(emptyJobForm); setShowForm(true); }
  function openEdit(j: EmployerJob) {
    setEditing(j);
    setForm({
      title: j.title,
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
  function closeForm() { setShowForm(false); setEditing(null); }
  function submitForm() {
    if (editing) updateMut.mutate({ id: editing.id, patch: { ...body(form), isActive: form.isActive } });
    else createMut.mutate(form);
  }
  const saving = createMut.isPending || updateMut.isPending;

  return (
    <EmployerShell>
      <PageHeader
        eyebrow="Recruiting"
        title="My Jobs"
        subtitle="Post opportunities and review the students who apply."
        icon={Briefcase}
        tone="indigo"
        actions={<button className={btn.primary} onClick={openAdd}><Plus className="h-4 w-4" /> New job</button>}
      />

      <Panel flush>
        {isLoading && <TableSkeleton cols={5} />}
        {isError && <div className="px-5 py-16 text-center text-sm text-rose-600">Couldn't load your jobs.</div>}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto">
              <table className={table.el}>
                <thead className={table.thead}>
                  <tr>
                    <th className={table.th}>Job</th>
                    <th className={table.th}>Type</th>
                    <th className={cn(table.th, "text-center")}>Applicants</th>
                    <th className={table.th}>Status</th>
                    <th className={cn(table.th, "text-right")}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((j) => (
                    <tr key={j.id} className={table.row}>
                      <td className={cn(table.td, "font-medium")}>
                        {j.title}
                        {j.location && <span className="ml-2 text-xs text-muted-foreground">{j.location}</span>}
                      </td>
                      <td className={table.td}>
                        <StatusPill tone={jobTypeTone(j.type) as Tone} dot={false}>{jobTypeLabels[j.type] ?? j.type}</StatusPill>
                      </td>
                      <td className={cn(table.td, "text-center")}>
                        <button
                          onClick={() => setApplicantsFor(j)}
                          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 tabular-nums transition-colors hover:bg-indigo-100"
                        >
                          <Users className="h-3 w-3" /> {j.applicantCount}
                        </button>
                      </td>
                      <td className={table.td}>
                        <StatusPill tone={j.isActive ? "emerald" : "rose"}>{j.isActive ? "Active" : "Inactive"}</StatusPill>
                      </td>
                      <td className={cn(table.td, "text-right")}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title={j.isActive ? "Deactivate" : "Activate"}
                            disabled={updateMut.isPending}
                            onClick={() => updateMut.mutate({ id: j.id, patch: { isActive: !j.isActive } })}
                            className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors", j.isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50")}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button title="Edit" onClick={() => openEdit(j)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 transition-colors hover:bg-indigo-50">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button title="Delete" onClick={() => setConfirmDelete(j)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center text-sm text-muted-foreground">
                        No jobs yet. Post your first opportunity to start receiving applications.
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
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Job title</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Graduate Software Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    {Object.keys(jobTypeLabels).map((t) => <option key={t} value={t}>{jobTypeLabels[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Location</label>
                  <input className={inputCls} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Johannesburg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Salary / stipend</label>
                  <input className={inputCls} value={form.salaryText} onChange={(e) => setForm((f) => ({ ...f, salaryText: e.target.value }))} placeholder="R25 000 / month" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Closing date</label>
                  <input type="date" className={inputCls} value={form.closesOn} onChange={(e) => setForm((f) => ({ ...f, closesOn: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tags (comma-separated)</label>
                <input className={inputCls} value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="Python, SQL, Remote-friendly" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea rows={3} className={cn(inputCls, "resize-none")} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" checked={form.isRemote} onChange={(e) => setForm((f) => ({ ...f, isRemote: e.target.checked }))} className="h-4 w-4 accent-indigo-600" />
                <span className="font-medium">Remote-friendly</span>
              </label>
              {editing && (
                <label className="flex items-center gap-2.5 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 accent-indigo-600" />
                  <span className="font-medium">Active (visible to students)</span>
                </label>
              )}
              {(createMut.isError || updateMut.isError) && (
                <p className="text-sm text-rose-600">Couldn't save the job. Please try again.</p>
              )}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border/60 bg-card px-6 py-4">
              <button className={btn.outline} onClick={closeForm}>Cancel</button>
              <button className={btn.primary} disabled={saving || !form.title.trim()} onClick={submitForm}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Post job"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><Trash2 className="h-7 w-7" /></div>
            <h2 className="mt-4 text-lg font-bold">Delete job?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Delete <span className="font-semibold text-foreground">{confirmDelete.title}</span>? Applications to it will also be removed.
            </p>
            {deleteMut.isError && <p className="mt-3 text-sm text-rose-600">Couldn't delete. Please try again.</p>}
            <div className="mt-6 flex justify-center gap-2">
              <button className={btn.outline} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className={cn(btn.primary, "bg-rose-600 hover:bg-rose-700")} disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(confirmDelete.id)}>
                {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {applicantsFor && (
        <JobApplicantsModal job={applicantsFor} scope="employer" onClose={() => setApplicantsFor(null)} />
      )}
    </EmployerShell>
  );
}
