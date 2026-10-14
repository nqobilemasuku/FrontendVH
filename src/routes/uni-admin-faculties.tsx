/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UniversityAdminShell } from "@/components/UniversityAdminShell";
import { Building2, Plus, Pencil, Trash2, X, Loader2, Check } from "lucide-react";
import { PageHeader, Panel, btn, table } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/uni-admin-faculties")({
  head: () => ({ meta: [{ title: "Faculties · Varsity Hub" }] }),
  component: UniAdminFaculties,
});

type Faculty = { id: string; name: string; universityId: string };

const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25";

function UniAdminFaculties() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Faculty | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["uni-admin-faculties"],
    queryFn: () => api.get<Faculty[]>("/api/uni-admin/faculties"),
  });
  const faculties = data ?? [];
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(faculties, 10);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["uni-admin-faculties"] });

  const createMut = useMutation({
    // universityId is inferred by the backend from the admin's linked university.
    mutationFn: (n: string) => api.post("/api/uni-admin/faculties", { name: n }),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });
  const renameMut = useMutation({
    mutationFn: ({ id, n }: { id: string; n: string }) =>
      api.patch(`/api/uni-admin/faculties/${id}`, { name: n }),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/api/uni-admin/faculties/${id}`),
    onSuccess: () => {
      invalidate();
      setConfirmDelete(null);
    },
  });

  function openAdd() {
    setEditing(null);
    setName("");
    setShowForm(true);
  }
  function openEdit(f: Faculty) {
    setEditing(f);
    setName(f.name);
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setName("");
  }
  function submitForm() {
    const n = name.trim();
    if (!n) return;
    if (editing) renameMut.mutate({ id: editing.id, n });
    else createMut.mutate(n);
  }
  const saving = createMut.isPending || renameMut.isPending;

  return (
    <UniversityAdminShell>
      <PageHeader
        eyebrow="Catalogue"
        title="Faculties"
        subtitle="Organise your programmes into faculties or schools."
        icon={Building2}
        tone="blue"
        actions={
          <button className={btn.primary} onClick={openAdd}>
            <Plus className="h-4 w-4" /> New faculty
          </button>
        }
      />

      <Panel flush>
        {isLoading && <TableSkeleton cols={2} />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">Couldn't load faculties.</div>
        )}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto">
              <table className={table.el}>
                <thead className={table.thead}>
                  <tr>
                    <th className={table.th}>Faculty</th>
                    <th className={cn(table.th, "text-right")}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((f) => (
                    <tr key={f.id} className={table.row}>
                      <td className={cn(table.td, "font-medium")}>{f.name}</td>
                      <td className={cn(table.td, "text-right")}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Rename"
                            onClick={() => openEdit(f)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => setConfirmDelete(f)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {faculties.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-5 py-16 text-center text-sm text-muted-foreground">
                        No faculties yet. Add one to group your programmes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} setPage={setPage} noun="faculties" />
          </>
        )}
      </Panel>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeForm}>
          <div className="w-full max-w-md rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <h2 className="text-lg font-bold">{editing ? "Rename faculty" : "New faculty"}</h2>
              <button onClick={closeForm} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Faculty name</label>
                <input
                  autoFocus
                  className={inputCls}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitForm()}
                  placeholder="Faculty of Engineering"
                />
              </div>
              {(createMut.isError || renameMut.isError) && (
                <p className="text-sm text-rose-600">Couldn't save the faculty. Please try again.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-border/60 px-6 py-4">
              <button className={btn.outline} onClick={closeForm}>Cancel</button>
              <button className={btn.primary} disabled={saving || !name.trim()} onClick={submitForm}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create faculty"}
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
            <h2 className="mt-4 text-lg font-bold">Delete faculty?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Delete <span className="font-semibold text-foreground">{confirmDelete.name}</span>? Programmes linked to it
              will no longer be grouped under a faculty.
            </p>
            {deleteMut.isError && (
              <p className="mt-3 text-sm text-rose-600">Couldn't delete. It may still have programmes attached.</p>
            )}
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
    </UniversityAdminShell>
  );
}
