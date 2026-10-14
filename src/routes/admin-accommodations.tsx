/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import { Home, Plus, Pencil, Trash2, X, Loader2, Check } from "lucide-react";
import { PageHeader, Panel, StatusPill, btn, table, type Tone } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-accommodations")({
  head: () => ({ meta: [{ title: "Accommodation · Varsity Hub" }] }),
  component: AdminAccommodations,
});

type AdminAccommodation = {
  id: string;
  name: string;
  type: string;
  pricePerMonth: number;
  campus: string | null;
  distanceText: string | null;
  amenities: string[];
  isVerified: boolean;
  nsfasAccredited: boolean;
  isActive: boolean;
};

const typeMeta: Record<string, { label: string; tone: Tone }> = {
  single_room: { label: "Single Room", tone: "primary" },
  shared_room: { label: "Shared Room", tone: "indigo" },
  bachelor: { label: "Bachelor", tone: "violet" },
  res: { label: "Res", tone: "emerald" },
  apartment: { label: "Apartment", tone: "amber" },
};
const tMeta = (t: string): { label: string; tone: Tone } =>
  typeMeta[t] ?? { label: t.replace(/_/g, " "), tone: "slate" };

const fmtPrice = (n: number) => `R ${n.toLocaleString("en-ZA")}`;

const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25";

type FormState = {
  name: string;
  type: string;
  pricePerMonth: string;
  campus: string;
  distanceText: string;
  amenities: string;
  isVerified: boolean;
  nsfasAccredited: boolean;
  isActive: boolean;
};
const emptyForm: FormState = {
  name: "",
  type: "single_room",
  pricePerMonth: "",
  campus: "",
  distanceText: "",
  amenities: "",
  isVerified: false,
  nsfasAccredited: false,
  isActive: true,
};

const parseAmenities = (s: string) =>
  s.split(",").map((a) => a.trim()).filter(Boolean);

function AdminAccommodations() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminAccommodation | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<AdminAccommodation | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-accommodations"],
    queryFn: () => api.get<AdminAccommodation[]>("/api/admin/accommodations"),
  });
  const items = data ?? [];
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(items, 10);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-accommodations"] });

  const body = (f: FormState) => ({
    name: f.name,
    type: f.type,
    pricePerMonth: Number(f.pricePerMonth) || 0,
    campus: f.campus || null,
    distanceText: f.distanceText || null,
    amenities: parseAmenities(f.amenities),
    isVerified: f.isVerified,
    nsfasAccredited: f.nsfasAccredited,
    isActive: f.isActive,
  });

  const createMut = useMutation({
    mutationFn: (f: FormState) => api.post("/api/admin/accommodations", body(f)),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, f }: { id: string; f: FormState }) =>
      api.patch(`/api/admin/accommodations/${id}`, body(f)),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/api/admin/accommodations/${id}`),
    onSuccess: () => {
      invalidate();
      setConfirmDelete(null);
    },
  });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }
  function openEdit(a: AdminAccommodation) {
    setEditing(a);
    setForm({
      name: a.name,
      type: a.type,
      pricePerMonth: String(a.pricePerMonth),
      campus: a.campus ?? "",
      distanceText: a.distanceText ?? "",
      amenities: a.amenities.join(", "),
      isVerified: a.isVerified,
      nsfasAccredited: a.nsfasAccredited,
      isActive: a.isActive,
    });
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }
  function submitForm() {
    if (!form.name.trim()) return;
    if (editing) updateMut.mutate({ id: editing.id, f: form });
    else createMut.mutate(form);
  }
  const saving = createMut.isPending || updateMut.isPending;

  return (
    <SuperAdminShell>
      <PageHeader
        eyebrow="Content"
        title="Accommodation"
        subtitle="Manage student accommodation listings across the platform."
        icon={Home}
        tone="fuchsia"
        actions={
          <button className={btn.primary} onClick={openAdd}>
            <Plus className="h-4 w-4" /> New listing
          </button>
        }
      />

      <Panel flush>
        {isLoading && <TableSkeleton cols={5} />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">Couldn't load accommodation.</div>
        )}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto">
              <table className={table.el}>
                <thead className={table.thead}>
                  <tr>
                    <th className={table.th}>Title</th>
                    <th className={table.th}>Type</th>
                    <th className={table.th}>Price</th>
                    <th className={table.th}>Campus</th>
                    <th className={cn(table.th, "text-right")}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((a) => {
                    const m = tMeta(a.type);
                    return (
                      <tr key={a.id} className={table.row}>
                        <td className={cn(table.td, "font-medium")}>{a.name}</td>
                        <td className={table.td}>
                          <StatusPill tone={m.tone} dot={false}>{m.label}</StatusPill>
                        </td>
                        <td className={cn(table.td, "font-semibold tabular-nums")}>{fmtPrice(a.pricePerMonth)}</td>
                        <td className={cn(table.td, "text-muted-foreground")}>{a.campus ?? "—"}</td>
                        <td className={cn(table.td, "text-right")}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              title="Edit"
                              onClick={() => openEdit(a)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              title="Delete"
                              onClick={() => setConfirmDelete(a)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center text-sm text-muted-foreground">
                        No accommodation listings yet. Add your first listing to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} setPage={setPage} noun="listings" />
          </>
        )}
      </Panel>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeForm}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
              <h2 className="text-lg font-bold">{editing ? "Edit listing" : "New listing"}</h2>
              <button onClick={closeForm} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Obz Square Student Residence" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    {Object.entries(typeMeta).map(([v, m]) => (
                      <option key={v} value={v}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Price / month</label>
                  <input type="number" className={inputCls} value={form.pricePerMonth} onChange={(e) => setForm((f) => ({ ...f, pricePerMonth: e.target.value }))} placeholder="3500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Campus</label>
                  <input className={inputCls} value={form.campus} onChange={(e) => setForm((f) => ({ ...f, campus: e.target.value }))} placeholder="UCT Upper Campus" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Distance</label>
                  <input className={inputCls} value={form.distanceText} onChange={(e) => setForm((f) => ({ ...f, distanceText: e.target.value }))} placeholder="5 min walk" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Amenities</label>
                <input className={inputCls} value={form.amenities} onChange={(e) => setForm((f) => ({ ...f, amenities: e.target.value }))} placeholder="wifi, meals, transport" />
                <p className="mt-1 text-[11px] text-muted-foreground">Comma-separated list.</p>
              </div>
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2.5 text-sm">
                  <input type="checkbox" checked={form.isVerified} onChange={(e) => setForm((f) => ({ ...f, isVerified: e.target.checked }))} className="h-4 w-4 rounded border-border text-fuchsia-600 focus:ring-fuchsia-500/30" />
                  <span className="font-medium">Verified</span>
                </label>
                <label className="flex items-center gap-2.5 text-sm">
                  <input type="checkbox" checked={form.nsfasAccredited} onChange={(e) => setForm((f) => ({ ...f, nsfasAccredited: e.target.checked }))} className="h-4 w-4 rounded border-border text-fuchsia-600 focus:ring-fuchsia-500/30" />
                  <span className="font-medium">NSFAS accredited</span>
                </label>
                <label className="flex items-center gap-2.5 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-border text-fuchsia-600 focus:ring-fuchsia-500/30" />
                  <span className="font-medium">Active</span>
                </label>
              </div>
              {(createMut.isError || updateMut.isError) && (
                <p className="text-sm text-rose-600">Couldn't save the listing. Please try again.</p>
              )}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border/60 bg-card px-6 py-4">
              <button className={btn.outline} onClick={closeForm}>Cancel</button>
              <button className={btn.primary} disabled={saving || !form.name.trim()} onClick={submitForm}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create listing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <Trash2 className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold">Delete listing?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Delete <span className="font-semibold text-foreground">{confirmDelete.name}</span>? This can't be undone.
            </p>
            {deleteMut.isError && <p className="mt-3 text-sm text-rose-600">Couldn't delete. Please try again.</p>}
            <div className="mt-6 flex justify-center gap-2">
              <button className={btn.outline} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className={cn(btn.primary, "bg-rose-600 hover:bg-rose-700")}
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate(confirmDelete.id)}
              >
                {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminShell>
  );
}
