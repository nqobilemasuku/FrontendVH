/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import { CalendarDays, Plus, Pencil, Trash2, X, Loader2, Check } from "lucide-react";
import { PageHeader, Panel, StatusPill, btn, table, type Tone } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-events")({
  head: () => ({ meta: [{ title: "Events · Varsity Hub" }] }),
  component: AdminEvents,
});

type AdminEvent = {
  id: string;
  title: string;
  type: string;
  host: string | null;
  location: string | null;
  isOnline: boolean;
  capacity: number | null;
  startsAt: string;
  endsAt: string | null;
  description: string | null;
};

const typeMeta: Record<string, { label: string; tone: Tone }> = {
  career_fair: { label: "Career Fair", tone: "primary" },
  workshop: { label: "Workshop", tone: "indigo" },
  networking: { label: "Networking", tone: "fuchsia" },
  open_day: { label: "Open Day", tone: "emerald" },
  seminar: { label: "Seminar", tone: "amber" },
};
const tMeta = (t: string): { label: string; tone: Tone } =>
  typeMeta[t] ?? { label: t.replace(/_/g, " "), tone: "slate" };

const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25";

// datetime-local <-> ISO helpers
const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : "");
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

type FormState = {
  title: string;
  type: string;
  host: string;
  location: string;
  isOnline: boolean;
  capacity: string;
  startsAt: string;
  endsAt: string;
  description: string;
};
const emptyForm: FormState = {
  title: "",
  type: "career_fair",
  host: "",
  location: "",
  isOnline: false,
  capacity: "",
  startsAt: "",
  endsAt: "",
  description: "",
};

function AdminEvents() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<AdminEvent | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => api.get<AdminEvent[]>("/api/admin/events"),
  });
  const events = data ?? [];
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(events, 10);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-events"] });

  const body = (f: FormState) => ({
    title: f.title,
    type: f.type,
    host: f.host || null,
    location: f.location || null,
    isOnline: f.isOnline,
    capacity: f.capacity ? Number(f.capacity) : null,
    startsAt: toIso(f.startsAt),
    endsAt: toIso(f.endsAt),
    description: f.description || null,
  });

  const createMut = useMutation({
    mutationFn: (f: FormState) => api.post("/api/admin/events", body(f)),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, f }: { id: string; f: FormState }) =>
      api.patch(`/api/admin/events/${id}`, body(f)),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/api/admin/events/${id}`),
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
  function openEdit(e: AdminEvent) {
    setEditing(e);
    setForm({
      title: e.title,
      type: e.type,
      host: e.host ?? "",
      location: e.location ?? "",
      isOnline: e.isOnline,
      capacity: e.capacity != null ? String(e.capacity) : "",
      startsAt: toLocalInput(e.startsAt),
      endsAt: toLocalInput(e.endsAt),
      description: e.description ?? "",
    });
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }
  function submitForm() {
    if (!form.title.trim() || !form.startsAt) return;
    if (editing) updateMut.mutate({ id: editing.id, f: form });
    else createMut.mutate(form);
  }
  const saving = createMut.isPending || updateMut.isPending;

  return (
    <SuperAdminShell>
      <PageHeader
        eyebrow="Content"
        title="Events"
        subtitle="Manage career fairs, workshops and networking events across the platform."
        icon={CalendarDays}
        tone="fuchsia"
        actions={
          <button className={btn.primary} onClick={openAdd}>
            <Plus className="h-4 w-4" /> New event
          </button>
        }
      />

      <Panel flush>
        {isLoading && <TableSkeleton cols={4} />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">Couldn't load events.</div>
        )}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto">
              <table className={table.el}>
                <thead className={table.thead}>
                  <tr>
                    <th className={table.th}>Title</th>
                    <th className={table.th}>Type</th>
                    <th className={table.th}>Starts</th>
                    <th className={cn(table.th, "text-right")}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((e) => {
                    const m = tMeta(e.type);
                    return (
                      <tr key={e.id} className={table.row}>
                        <td className={cn(table.td, "font-medium")}>
                          {e.title}
                          {e.location && (
                            <span className="block text-xs font-normal text-muted-foreground">
                              {e.isOnline ? "Online" : e.location}
                            </span>
                          )}
                        </td>
                        <td className={table.td}>
                          <StatusPill tone={m.tone} dot={false}>{m.label}</StatusPill>
                        </td>
                        <td className={cn(table.td, "text-muted-foreground")}>{fmtDateTime(e.startsAt)}</td>
                        <td className={cn(table.td, "text-right")}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              title="Edit"
                              onClick={() => openEdit(e)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              title="Delete"
                              onClick={() => setConfirmDelete(e)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center text-sm text-muted-foreground">
                        No events yet. Create your first event to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} setPage={setPage} noun="events" />
          </>
        )}
      </Panel>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeForm}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
              <h2 className="text-lg font-bold">{editing ? "Edit event" : "New event"}</h2>
              <button onClick={closeForm} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Autumn Career Fair 2026" />
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
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Capacity</label>
                  <input type="number" className={inputCls} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Starts at</label>
                  <input type="datetime-local" className={inputCls} value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ends at</label>
                  <input type="datetime-local" className={inputCls} value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Host</label>
                <input className={inputCls} value={form.host} onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))} placeholder="University of Cape Town" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Location</label>
                <input className={inputCls} value={form.location} disabled={form.isOnline} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Sports Centre, Upper Campus" />
              </div>
              <label className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" checked={form.isOnline} onChange={(e) => setForm((f) => ({ ...f, isOnline: e.target.checked }))} className="h-4 w-4 rounded border-border text-fuchsia-600 focus:ring-fuchsia-500/30" />
                <span className="font-medium">Online event</span>
              </label>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea rows={3} className={cn(inputCls, "resize-none")} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              {(createMut.isError || updateMut.isError) && (
                <p className="text-sm text-rose-600">Couldn't save the event. Please try again.</p>
              )}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border/60 bg-card px-6 py-4">
              <button className={btn.outline} onClick={closeForm}>Cancel</button>
              <button className={btn.primary} disabled={saving || !form.title.trim() || !form.startsAt} onClick={submitForm}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create event"}
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
            <h2 className="mt-4 text-lg font-bold">Delete event?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Delete <span className="font-semibold text-foreground">{confirmDelete.title}</span>? Registered students will lose access to it.
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
