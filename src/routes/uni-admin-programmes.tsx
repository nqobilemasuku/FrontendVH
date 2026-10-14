/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UniversityAdminShell } from "@/components/UniversityAdminShell";
import { BookOpen, Plus, Pencil, X, Loader2, Power } from "lucide-react";
import { PageHeader, Panel, StatusPill, btn, table } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/uni-admin-programmes")({
  head: () => ({ meta: [{ title: "Programmes · Varsity Hub" }] }),
  component: UniAdminProgrammes,
});

type UniProgramme = {
  id: string;
  name: string;
  qualification: string;
  minAps: number;
  facultyId: string | null;
  tuitionPerYear: number | null;
  durationYears: number | null;
  applicationDeadline: string | null;
  isActive: boolean;
};

const qualificationLabels: Record<string, string> = {
  higher_certificate: "Higher Certificate",
  diploma: "Diploma",
  bachelor: "Bachelor's",
  honours: "Honours",
  masters: "Master's",
  doctorate: "Doctorate",
};
const qualLabel = (q: string) => qualificationLabels[q] ?? q.replace(/_/g, " ");

const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25";

type FormState = {
  name: string;
  qualification: string;
  minAps: string;
  facultyId: string;
  durationYears: string;
  tuitionPerYear: string;
  applicationDeadline: string;
  description: string;
  isActive: boolean;
};
const emptyForm: FormState = {
  name: "",
  qualification: "bachelor",
  minAps: "",
  facultyId: "",
  durationYears: "",
  tuitionPerYear: "",
  applicationDeadline: "",
  description: "",
  isActive: true,
};

function UniAdminProgrammes() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UniProgramme | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["uni-admin-programmes"],
    queryFn: () => api.get<UniProgramme[]>("/api/uni-admin/programmes"),
  });
  const programmes = data ?? [];
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(programmes, 10);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["uni-admin-programmes"] });

  const { data: faculties } = useQuery({
    queryKey: ["uni-admin-faculties"],
    queryFn: () => api.get<{ id: string; name: string }[]>("/api/uni-admin/faculties"),
  });

  const createMut = useMutation({
    // universityId is inferred by the backend from the admin's linked university.
    mutationFn: (f: FormState) =>
      api.post("/api/uni-admin/programmes", {
        name: f.name,
        qualification: f.qualification,
        minAps: Number(f.minAps) || 0,
        facultyId: f.facultyId || null,
        durationYears: f.durationYears ? Number(f.durationYears) : null,
        tuitionPerYear: f.tuitionPerYear ? Number(f.tuitionPerYear) : null,
        description: f.description || null,
        applicationDeadline: f.applicationDeadline || null,
      }),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/api/uni-admin/programmes/${id}`, body),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }
  function openEdit(p: UniProgramme) {
    setEditing(p);
    setForm({
      name: p.name,
      qualification: p.qualification,
      minAps: String(p.minAps),
      facultyId: p.facultyId ?? "",
      durationYears: p.durationYears != null ? String(p.durationYears) : "",
      tuitionPerYear: p.tuitionPerYear != null ? String(p.tuitionPerYear) : "",
      applicationDeadline: p.applicationDeadline ? p.applicationDeadline.slice(0, 10) : "",
      description: "",
      isActive: p.isActive,
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
          minAps: Number(form.minAps) || 0,
          tuitionPerYear: form.tuitionPerYear ? Number(form.tuitionPerYear) : null,
          durationYears: form.durationYears ? Number(form.durationYears) : null,
          applicationDeadline: form.applicationDeadline || null,
          description: form.description || null,
          isActive: form.isActive,
        },
      });
    } else {
      createMut.mutate(form);
    }
  }
  const saving = createMut.isPending || updateMut.isPending;
  const createErr =
    createMut.error instanceof ApiError && /universit/i.test(createMut.error.message);

  return (
    <UniversityAdminShell>
      <PageHeader
        eyebrow="Admissions"
        title="Programmes"
        subtitle="Manage the programmes your institution offers."
        icon={BookOpen}
        tone="blue"
        actions={
          <button className={btn.primary} onClick={openAdd}>
            <Plus className="h-4 w-4" /> New programme
          </button>
        }
      />

      <Panel flush>
        {isLoading && <TableSkeleton cols={5} />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">Couldn't load programmes.</div>
        )}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto">
              <table className={table.el}>
                <thead className={table.thead}>
                  <tr>
                    <th className={table.th}>Programme</th>
                    <th className={table.th}>Qualification</th>
                    <th className={cn(table.th, "text-center")}>Min APS</th>
                    <th className={table.th}>Status</th>
                    <th className={cn(table.th, "text-right")}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => (
                    <tr key={p.id} className={table.row}>
                      <td className={cn(table.td, "font-medium")}>{p.name}</td>
                      <td className={table.td}>
                        <StatusPill tone="indigo" dot={false}>{qualLabel(p.qualification)}</StatusPill>
                      </td>
                      <td className={cn(table.td, "text-center font-semibold tabular-nums")}>{p.minAps}</td>
                      <td className={table.td}>
                        <StatusPill tone={p.isActive ? "emerald" : "rose"}>
                          {p.isActive ? "Active" : "Inactive"}
                        </StatusPill>
                      </td>
                      <td className={cn(table.td, "text-right")}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title={p.isActive ? "Deactivate" : "Activate"}
                            disabled={updateMut.isPending}
                            onClick={() => updateMut.mutate({ id: p.id, body: { name: p.name, minAps: p.minAps, isActive: !p.isActive } })}
                            className={cn(
                              "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                              p.isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50",
                            )}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            title="Edit"
                            onClick={() => openEdit(p)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {programmes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center text-sm text-muted-foreground">
                        No programmes yet. Add your first programme to start receiving applications.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} setPage={setPage} noun="programmes" />
          </>
        )}
      </Panel>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeForm}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
              <h2 className="text-lg font-bold">{editing ? "Edit programme" : "New programme"}</h2>
              <button onClick={closeForm} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Programme name</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="BSc Computer Science" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Qualification</label>
                  <select className={inputCls} value={form.qualification} disabled={!!editing} onChange={(e) => setForm((f) => ({ ...f, qualification: e.target.value }))}>
                    {Object.keys(qualificationLabels).map((q) => (
                      <option key={q} value={q}>{qualificationLabels[q]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Minimum APS</label>
                  <input type="number" className={inputCls} value={form.minAps} onChange={(e) => setForm((f) => ({ ...f, minAps: e.target.value }))} />
                </div>
              </div>
              {!editing && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Faculty (optional)</label>
                  <select className={inputCls} value={form.facultyId} onChange={(e) => setForm((f) => ({ ...f, facultyId: e.target.value }))}>
                    <option value="">— No faculty —</option>
                    {(faculties ?? []).map((fac) => (
                      <option key={fac.id} value={fac.id}>{fac.name}</option>
                    ))}
                  </select>
                  {(faculties ?? []).length === 0 && (
                    <p className="mt-1 text-[11px] text-muted-foreground">Add faculties from the Faculties page to group programmes.</p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Duration (years)</label>
                  <input type="number" className={inputCls} value={form.durationYears} onChange={(e) => setForm((f) => ({ ...f, durationYears: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tuition / year</label>
                  <input type="number" className={inputCls} value={form.tuitionPerYear} onChange={(e) => setForm((f) => ({ ...f, tuitionPerYear: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Application deadline</label>
                <input type="date" className={inputCls} value={form.applicationDeadline} onChange={(e) => setForm((f) => ({ ...f, applicationDeadline: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea rows={3} className={cn(inputCls, "resize-none")} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              {editing && (
                <label className="flex items-center gap-2.5 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 accent-blue-600" />
                  <span className="font-medium">Active</span>
                </label>
              )}
              {(createMut.isError || updateMut.isError) && (
                <p className="text-sm text-rose-600">
                  {createErr
                    ? "The backend couldn't determine your university for this programme. Check the /api/uni-admin/programmes endpoint."
                    : "Couldn't save the programme. Please try again."}
                </p>
              )}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border/60 bg-card px-6 py-4">
              <button className={btn.outline} onClick={closeForm}>Cancel</button>
              <button className={btn.primary} disabled={saving || !form.name} onClick={submitForm}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create programme"}
              </button>
            </div>
          </div>
        </div>
      )}
    </UniversityAdminShell>
  );
}
