import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import { BookOpen, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { PageHeader, Panel, StatusPill, btn, table } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-programmes")({
  head: () => ({ meta: [{ title: "Programme Management · Varsity Hub" }] }),
  component: AdminProgrammes,
});

type AdminProgramme = {
  id: string;
  universityId: string;
  name: string;
  qualification: string;
  minAps: number;
  isActive: boolean;
};

type UniOption = { id: string; name: string; shortCode: string };

const qualificationLabels: Record<string, string> = {
  bachelor: "Bachelor's",
  diploma: "Diploma",
  higher_certificate: "Higher Certificate",
  honours: "Honours",
  masters: "Master's",
  doctorate: "Doctorate",
};

function qualLabel(q: string) {
  return qualificationLabels[q] ?? q.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function apsBadgeStyle(aps: number) {
  if (aps >= 36) return "bg-rose-50 text-rose-600";
  if (aps >= 31) return "bg-amber-50 text-amber-600";
  if (aps >= 26) return "bg-blue-50 text-blue-600";
  return "bg-emerald-50 text-emerald-600";
}

const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25";
const selectCls =
  "rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25";

type FormState = {
  universityId: string;
  name: string;
  qualification: string;
  minAps: string;
  durationYears: string;
  tuitionPerYear: string;
  description: string;
  applicationDeadline: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  universityId: "",
  name: "",
  qualification: "bachelor",
  minAps: "",
  durationYears: "",
  tuitionPerYear: "",
  description: "",
  applicationDeadline: "",
  isActive: true,
};

function AdminProgrammes() {
  const qc = useQueryClient();
  const [universityId, setUniversityId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminProgramme | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: universities } = useQuery({
    queryKey: ["admin-universities"],
    queryFn: () => api.get<UniOption[]>("/api/admin/universities"),
  });
  const uniList = universities ?? [];
  const uniName = (id: string) => {
    const u = uniList.find((x) => x.id === id);
    return u ? u.shortCode || u.name : id;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-programmes", universityId],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (universityId) qs.set("universityId", universityId);
      return api.get<AdminProgramme[]>(`/api/admin/programmes?${qs.toString()}`);
    },
  });
  const programmes = data ?? [];
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(programmes, 10);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-programmes"] });

  const createMut = useMutation({
    mutationFn: (f: FormState) =>
      api.post("/api/admin/programmes", {
        universityId: f.universityId,
        name: f.name,
        qualification: f.qualification,
        minAps: Number(f.minAps) || 0,
        durationYears: f.durationYears ? Number(f.durationYears) : undefined,
        tuitionPerYear: f.tuitionPerYear ? Number(f.tuitionPerYear) : undefined,
        description: f.description || undefined,
        applicationDeadline: f.applicationDeadline || undefined,
      }),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, f }: { id: string; f: FormState }) =>
      api.patch(`/api/admin/programmes/${id}`, {
        name: f.name,
        minAps: Number(f.minAps) || 0,
        isActive: f.isActive,
      }),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/api/admin/programmes/${id}`),
    onSuccess: invalidate,
  });

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm, universityId: universityId || uniList[0]?.id || "" });
    setShowForm(true);
  }
  function openEdit(p: AdminProgramme) {
    setEditing(p);
    setForm({
      ...emptyForm,
      universityId: p.universityId,
      name: p.name,
      qualification: p.qualification,
      minAps: String(p.minAps),
      isActive: p.isActive,
    });
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }
  function submitForm() {
    if (editing) updateMut.mutate({ id: editing.id, f: form });
    else createMut.mutate(form);
  }
  const saving = createMut.isPending || updateMut.isPending;

  return (
    <SuperAdminShell>
      <PageHeader
        eyebrow="National Administration"
        title="Programme Management"
        subtitle="Manage all programmes across every university."
        icon={BookOpen}
        tone="fuchsia"
        actions={
          <button className={btn.primary} onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Programme
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <select
          className={selectCls}
          value={universityId}
          onChange={(e) => setUniversityId(e.target.value)}
        >
          <option value="">All Universities</option>
          {uniList.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <Panel flush>
        {isLoading && <TableSkeleton cols={6} />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">
            Couldn't load programmes.
          </div>
        )}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto">
            <table className={table.el}>
              <thead className={table.thead}>
                <tr>
                  <th className={table.th}>Programme</th>
                  <th className={table.th}>Qualification</th>
                  <th className={table.th}>University</th>
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
                      <StatusPill tone="indigo" dot={false}>
                        {qualLabel(p.qualification)}
                      </StatusPill>
                    </td>
                    <td className={cn(table.td, "text-muted-foreground")}>
                      {uniName(p.universityId)}
                    </td>
                    <td className={cn(table.td, "text-center")}>
                      <span
                        className={cn(
                          "inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-xs font-bold tabular-nums",
                          apsBadgeStyle(p.minAps),
                        )}
                      >
                        {p.minAps}
                      </span>
                    </td>
                    <td className={table.td}>
                      <StatusPill tone={p.isActive ? "emerald" : "rose"}>
                        {p.isActive ? "Active" : "Inactive"}
                      </StatusPill>
                    </td>
                    <td className={cn(table.td, "text-right")}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEdit(p)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          disabled={deleteMut.isPending}
                          onClick={() => {
                            if (confirm(`Delete ${p.name}?`)) deleteMut.mutate(p.id);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {programmes.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-sm text-muted-foreground"
                    >
                      No programmes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              from={from}
              to={to}
              setPage={setPage}
              noun="programmes"
            />
          </>
        )}
      </Panel>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeForm}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
              <h2 className="text-lg font-bold">{editing ? "Edit Programme" : "Add Programme"}</h2>
              <button
                onClick={closeForm}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  University
                </label>
                <select
                  className={inputCls}
                  value={form.universityId}
                  disabled={!!editing}
                  onChange={(e) => setForm((f) => ({ ...f, universityId: e.target.value }))}
                >
                  <option value="">Select university…</option>
                  {uniList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Name
                </label>
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="BSc Computer Science"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Qualification
                  </label>
                  <select
                    className={inputCls}
                    value={form.qualification}
                    disabled={!!editing}
                    onChange={(e) => setForm((f) => ({ ...f, qualification: e.target.value }))}
                  >
                    {Object.keys(qualificationLabels).map((q) => (
                      <option key={q} value={q}>
                        {qualificationLabels[q]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Min APS
                  </label>
                  <input
                    type="number"
                    className={inputCls}
                    value={form.minAps}
                    onChange={(e) => setForm((f) => ({ ...f, minAps: e.target.value }))}
                  />
                </div>
              </div>
              {!editing && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Duration (years)
                      </label>
                      <input
                        type="number"
                        className={inputCls}
                        value={form.durationYears}
                        onChange={(e) => setForm((f) => ({ ...f, durationYears: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Tuition / year
                      </label>
                      <input
                        type="number"
                        className={inputCls}
                        value={form.tuitionPerYear}
                        onChange={(e) => setForm((f) => ({ ...f, tuitionPerYear: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Application deadline
                    </label>
                    <input
                      type="date"
                      className={inputCls}
                      value={form.applicationDeadline}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, applicationDeadline: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      className={cn(inputCls, "resize-none")}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                </>
              )}
              {editing && (
                <label className="flex items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-fuchsia-600 focus:ring-fuchsia-500/30"
                  />
                  <span className="font-medium">Active</span>
                </label>
              )}
              {(createMut.isError || updateMut.isError) && (
                <p className="text-sm text-rose-600">Couldn't save the programme.</p>
              )}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border/60 bg-card px-6 py-4">
              <button className={btn.outline} onClick={closeForm}>
                Cancel
              </button>
              <button
                className={btn.primary}
                disabled={saving || !form.name || (!editing && !form.universityId)}
                onClick={submitForm}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminShell>
  );
}
