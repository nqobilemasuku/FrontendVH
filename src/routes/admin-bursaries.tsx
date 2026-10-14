/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import { GraduationCap, Plus, Pencil, Trash2, X, Loader2, Power, Users } from "lucide-react";
import { PageHeader, Panel, StatusPill, btn, table } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-bursaries")({
  head: () => ({ meta: [{ title: "Bursaries · Varsity Hub" }] }),
  component: AdminBursaries,
});

type BursaryField =
  | "engineering"
  | "it_science"
  | "commerce"
  | "health"
  | "education"
  | "law"
  | "arts"
  | "other";
type BursaryAppStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected";

type AdminBursary = {
  id: string;
  name: string;
  provider: string;
  field: BursaryField;
  amountText: string | null;
  covers: string[];
  minAps: number | null;
  description: string | null;
  closesOn: string | null;
  applyUrl: string | null;
  isActive: boolean;
  applicantCount: number;
};

type BursaryApplicant = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: BursaryAppStatus;
  submittedAt: string;
};

const fieldLabels: Record<BursaryField, string> = {
  engineering: "Engineering",
  it_science: "IT & Science",
  commerce: "Commerce",
  health: "Health",
  education: "Education",
  law: "Law",
  arts: "Arts",
  other: "Other",
};
const fields = Object.keys(fieldLabels) as BursaryField[];

const appStatusLabels: Record<BursaryAppStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
};
const appStatuses = Object.keys(appStatusLabels) as BursaryAppStatus[];

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });

const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25";

type FormState = {
  name: string;
  provider: string;
  field: BursaryField;
  amountText: string;
  minAps: string;
  closesOn: string;
  covers: string;
  description: string;
  applyUrl: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  provider: "",
  field: "engineering",
  amountText: "",
  minAps: "",
  closesOn: "",
  covers: "",
  description: "",
  applyUrl: "",
  isActive: true,
};

const parseList = (s: string) =>
  s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

function AdminBursaries() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminBursary | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [applicantsFor, setApplicantsFor] = useState<AdminBursary | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-bursaries"],
    queryFn: () => api.get<AdminBursary[]>("/api/admin/bursaries"),
  });
  const bursaries = data ?? [];
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(bursaries, 10);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-bursaries"] });

  const createMut = useMutation({
    mutationFn: (f: FormState) =>
      api.post("/api/admin/bursaries", {
        name: f.name,
        provider: f.provider,
        field: f.field,
        amountText: f.amountText || null,
        covers: parseList(f.covers),
        minAps: f.minAps ? Number(f.minAps) : null,
        description: f.description || null,
        closesOn: f.closesOn || null,
        applyUrl: f.applyUrl || null,
      }),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/api/admin/bursaries/${id}`, body),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/api/admin/bursaries/${id}`, { isActive }),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/api/admin/bursaries/${id}`),
    onSuccess: invalidate,
  });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }
  function openEdit(b: AdminBursary) {
    setEditing(b);
    setForm({
      name: b.name,
      provider: b.provider,
      field: b.field,
      amountText: b.amountText ?? "",
      minAps: b.minAps != null ? String(b.minAps) : "",
      closesOn: b.closesOn ? b.closesOn.slice(0, 10) : "",
      covers: b.covers.join(", "),
      description: b.description ?? "",
      applyUrl: b.applyUrl ?? "",
      isActive: b.isActive,
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
          name: form.name,
          provider: form.provider,
          field: form.field,
          amountText: form.amountText || null,
          covers: parseList(form.covers),
          minAps: form.minAps ? Number(form.minAps) : null,
          description: form.description || null,
          closesOn: form.closesOn || null,
          applyUrl: form.applyUrl || null,
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
        title="Bursaries"
        subtitle="Manage funding opportunities and review applicants across the platform."
        icon={GraduationCap}
        tone="fuchsia"
        actions={
          <button className={btn.primary} onClick={openAdd}>
            <Plus className="h-4 w-4" />
            New bursary
          </button>
        }
      />

      <Panel flush>
        {isLoading && <TableSkeleton cols={6} />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">Couldn't load bursaries.</div>
        )}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto">
              <table className={table.el}>
                <thead className={table.thead}>
                  <tr>
                    <th className={table.th}>Name</th>
                    <th className={table.th}>Provider</th>
                    <th className={table.th}>Field</th>
                    <th className={cn(table.th, "text-center")}>Applicants</th>
                    <th className={table.th}>Status</th>
                    <th className={cn(table.th, "text-right")}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((b) => (
                    <tr key={b.id} className={table.row}>
                      <td className={cn(table.td, "font-medium")}>{b.name}</td>
                      <td className={cn(table.td, "text-muted-foreground")}>{b.provider}</td>
                      <td className={table.td}>
                        <StatusPill tone="indigo" dot={false}>
                          {fieldLabels[b.field]}
                        </StatusPill>
                      </td>
                      <td className={cn(table.td, "text-center font-semibold tabular-nums")}>
                        {b.applicantCount}
                      </td>
                      <td className={table.td}>
                        <StatusPill tone={b.isActive ? "emerald" : "rose"}>
                          {b.isActive ? "Active" : "Inactive"}
                        </StatusPill>
                      </td>
                      <td className={cn(table.td, "text-right")}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title={b.isActive ? "Deactivate" : "Activate"}
                            disabled={toggleMut.isPending}
                            onClick={() => toggleMut.mutate({ id: b.id, isActive: !b.isActive })}
                            className={cn(
                              "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50",
                              b.isActive
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50",
                            )}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="View applicants"
                            onClick={() => setApplicantsFor(b)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fuchsia-600 transition-colors hover:bg-fuchsia-50"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => openEdit(b)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            disabled={deleteMut.isPending}
                            onClick={() => {
                              if (confirm(`Delete ${b.name}?`)) deleteMut.mutate(b.id);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bursaries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">
                        No bursaries yet. Add your first funding opportunity to start receiving applications.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} setPage={setPage} noun="bursaries" />
          </>
        )}
      </Panel>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeForm}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
              <h2 className="text-lg font-bold">{editing ? "Edit bursary" : "New bursary"}</h2>
              <button onClick={closeForm} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Sasol Engineering Bursary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Provider</label>
                  <input className={inputCls} value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} placeholder="Sasol" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Field</label>
                  <select className={inputCls} value={form.field} onChange={(e) => setForm((f) => ({ ...f, field: e.target.value as BursaryField }))}>
                    {fields.map((fld) => (
                      <option key={fld} value={fld}>{fieldLabels[fld]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Amount</label>
                  <input className={inputCls} value={form.amountText} onChange={(e) => setForm((f) => ({ ...f, amountText: e.target.value }))} placeholder="Full cost + stipend" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Min APS</label>
                  <input type="number" className={inputCls} value={form.minAps} onChange={(e) => setForm((f) => ({ ...f, minAps: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Closes on</label>
                <input type="date" className={inputCls} value={form.closesOn} onChange={(e) => setForm((f) => ({ ...f, closesOn: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Covers (comma-separated)</label>
                <input className={inputCls} value={form.covers} onChange={(e) => setForm((f) => ({ ...f, covers: e.target.value }))} placeholder="Tuition, Accommodation, Books" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Apply URL (external link)</label>
                <input className={inputCls} value={form.applyUrl} onChange={(e) => setForm((f) => ({ ...f, applyUrl: e.target.value }))} placeholder="https://provider.co.za/apply" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea rows={3} className={cn(inputCls, "resize-none")} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              {editing && (
                <label className="flex items-center gap-2.5 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-border text-fuchsia-600 focus:ring-fuchsia-500/30" />
                  <span className="font-medium">Active</span>
                </label>
              )}
              {(createMut.isError || updateMut.isError) && (
                <p className="text-sm text-rose-600">Couldn't save the bursary. Please try again.</p>
              )}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border/60 bg-card px-6 py-4">
              <button className={btn.outline} onClick={closeForm}>Cancel</button>
              <button className={btn.primary} disabled={saving || !form.name || !form.provider} onClick={submitForm}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create bursary"}
              </button>
            </div>
          </div>
        </div>
      )}

      {applicantsFor && (
        <ApplicantsModal bursary={applicantsFor} onClose={() => setApplicantsFor(null)} />
      )}
    </SuperAdminShell>
  );
}

function ApplicantsModal({ bursary, onClose }: { bursary: AdminBursary; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-bursary-applicants", bursary.id],
    queryFn: () => api.get<BursaryApplicant[]>(`/api/admin/bursaries/${bursary.id}/applicants`),
  });
  const applicants = data ?? [];

  const statusMut = useMutation({
    mutationFn: ({ applicantId, status }: { applicantId: string; status: BursaryAppStatus }) =>
      api.patch(`/api/admin/bursary-applications/${applicantId}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-bursary-applicants", bursary.id] }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">Applicants</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{bursary.name}</p>
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
                    <th className={table.th}>Submitted</th>
                    <th className={table.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((a) => (
                    <tr key={a.id} className={table.row}>
                      <td className={cn(table.td, "font-medium")}>{a.studentName}</td>
                      <td className={cn(table.td, "text-muted-foreground")}>{a.studentEmail}</td>
                      <td className={cn(table.td, "text-muted-foreground")}>{dateFmt(a.submittedAt)}</td>
                      <td className={table.td}>
                        <select
                          className={inputCls}
                          value={a.status}
                          disabled={statusMut.isPending}
                          onChange={(e) => statusMut.mutate({ applicantId: a.id, status: e.target.value as BursaryAppStatus })}
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
