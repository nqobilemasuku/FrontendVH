import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  BadgeCheck,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  StatusPill,
  btn,
  table,
  toneClasses,
  type Tone,
} from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-universities")({
  head: () => ({ meta: [{ title: "University Management · Varsity Hub" }] }),
  component: AdminUniversities,
});

type AdminUniversity = {
  id: string;
  name: string;
  shortCode: string;
  province: string;
  domain: string | null;
  website: string | null;
  isVerified: boolean;
};

const provinces = [
  "Gauteng",
  "Western Cape",
  "KwaZulu Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

const logoTones = ["blue", "indigo", "violet", "emerald", "amber", "teal", "cyan", "sky"] as const;

const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25";

type FormState = {
  name: string;
  shortCode: string;
  province: string;
  domain: string;
  website: string;
  isVerified: boolean;
};

const emptyForm: FormState = {
  name: "",
  shortCode: "",
  province: provinces[0],
  domain: "",
  website: "",
  isVerified: false,
};

function AdminUniversities() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<AdminUniversity | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [assignFor, setAssignFor] = useState<AdminUniversity | null>(null);
  const [assign, setAssign] = useState({ profileId: "", title: "" });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-universities"],
    queryFn: () => api.get<AdminUniversity[]>("/api/admin/universities"),
  });
  const unis = data ?? [];
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(unis, 10);

  // Candidate users to assign as this university's admin (fetched when the modal opens).
  const { data: adminCandidates } = useQuery({
    queryKey: ["admin-users", "university_admin-picker"],
    enabled: !!assignFor,
    queryFn: () =>
      api.get<{ id: string; fullName: string; email: string | null }[]>(
        "/api/admin/users?role=university_admin&page=1&pageSize=200",
      ),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-universities"] });

  const createMut = useMutation({
    mutationFn: (body: FormState) =>
      api.post("/api/admin/universities", {
        name: body.name,
        shortCode: body.shortCode,
        province: body.province,
        domain: body.domain || null,
        website: body.website || null,
      }),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<FormState> }) =>
      api.patch(`/api/admin/universities/${id}`, {
        name: body.name,
        province: body.province,
        domain: body.domain || null,
        website: body.website || null,
        isVerified: body.isVerified,
      }),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/api/admin/universities/${id}`),
    onSuccess: invalidate,
  });

  const verifyMut = useMutation({
    mutationFn: (u: AdminUniversity) =>
      api.patch(`/api/admin/universities/${u.id}`, {
        name: u.name,
        province: u.province,
        domain: u.domain,
        website: u.website,
        isVerified: !u.isVerified,
      }),
    onSuccess: invalidate,
  });

  const assignMut = useMutation({
    mutationFn: ({ id, profileId, title }: { id: string; profileId: string; title: string }) =>
      api.post(`/api/admin/universities/${id}/admins`, { profileId, title }),
    onSuccess: () => {
      invalidate();
      setAssignFor(null);
      setAssign({ profileId: "", title: "" });
    },
  });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }
  function openEdit(u: AdminUniversity) {
    setEditing(u);
    setForm({
      name: u.name,
      shortCode: u.shortCode,
      province: u.province,
      domain: u.domain ?? "",
      website: u.website ?? "",
      isVerified: u.isVerified,
    });
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }
  function submitForm() {
    if (editing) updateMut.mutate({ id: editing.id, body: form });
    else createMut.mutate(form);
  }

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <SuperAdminShell>
      <PageHeader
        eyebrow="National Administration"
        title="University Management"
        subtitle="Manage all registered universities on the platform."
        icon={Building2}
        tone="fuchsia"
        actions={
          <button className={btn.primary} onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add University
          </button>
        }
      />

      <Panel flush>
        {isLoading && <TableSkeleton />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">
            Couldn't load universities.
          </div>
        )}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto">
            <table className={table.el}>
              <thead className={table.thead}>
                <tr>
                  <th className={table.th}>University</th>
                  <th className={table.th}>Province</th>
                  <th className={table.th}>Domain</th>
                  <th className={table.th}>Status</th>
                  <th className={cn(table.th, "text-right")}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((u, idx) => {
                  const logo = toneClasses(logoTones[idx % logoTones.length]);
                  return (
                    <tr key={u.id} className={table.row}>
                      <td className={table.td}>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1",
                              logo.soft,
                              logo.text,
                              logo.ring,
                            )}
                          >
                            {u.shortCode}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium leading-tight">{u.name}</div>
                            {u.website && (
                              <a
                                href={u.website}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                              >
                                {u.website.replace(/^https?:\/\//, "")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={cn(table.td, "text-muted-foreground")}>{u.province}</td>
                      <td className={cn(table.td, "text-muted-foreground")}>{u.domain ?? "—"}</td>
                      <td className={table.td}>
                        <button
                          type="button"
                          title="Toggle verified"
                          disabled={verifyMut.isPending}
                          onClick={() => verifyMut.mutate(u)}
                        >
                          <StatusPill tone={u.isVerified ? "emerald" : "slate"}>
                            {u.isVerified ? "Verified" : "Unverified"}
                          </StatusPill>
                        </button>
                      </td>
                      <td className={cn(table.td, "text-right")}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Assign admin"
                            onClick={() => setAssignFor(u)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 transition-colors hover:bg-indigo-50"
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => openEdit(u)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            disabled={deleteMut.isPending}
                            onClick={() => {
                              if (confirm(`Delete ${u.name}?`)) deleteMut.mutate(u.id);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {unis.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-sm text-muted-foreground"
                    >
                      No universities registered yet.
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
              noun="universities"
            />
          </>
        )}
      </Panel>

      {/* Add / edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeForm}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <h2 className="text-lg font-bold">
                {editing ? "Edit University" : "Add University"}
              </h2>
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
                  Name
                </label>
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="University of Cape Town"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Short code
                  </label>
                  <input
                    className={inputCls}
                    value={form.shortCode}
                    disabled={!!editing}
                    onChange={(e) => setForm((f) => ({ ...f, shortCode: e.target.value }))}
                    placeholder="UCT"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Province
                  </label>
                  <select
                    className={inputCls}
                    value={form.province}
                    onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                  >
                    {provinces.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Domain
                </label>
                <input
                  className={inputCls}
                  value={form.domain}
                  onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                  placeholder="uct.ac.za"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Website
                </label>
                <input
                  className={inputCls}
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://www.uct.ac.za"
                />
              </div>
              {editing && (
                <label className="flex items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={(e) => setForm((f) => ({ ...f, isVerified: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-fuchsia-600 focus:ring-fuchsia-500/30"
                  />
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" /> Verified
                  </span>
                </label>
              )}
              {(createMut.isError || updateMut.isError) && (
                <p className="text-sm text-rose-600">Couldn't save. Please check the fields.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-border/60 px-6 py-4">
              <button className={btn.outline} onClick={closeForm}>
                Cancel
              </button>
              <button
                className={btn.primary}
                disabled={saving || !form.name || (!editing && !form.shortCode)}
                onClick={submitForm}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign admin modal */}
      {assignFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setAssignFor(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <h2 className="text-lg font-bold">Assign admin · {assignFor.shortCode}</h2>
              <button
                onClick={() => setAssignFor(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  University admin
                </label>
                <select
                  className={inputCls}
                  value={assign.profileId}
                  onChange={(e) => setAssign((a) => ({ ...a, profileId: e.target.value }))}
                >
                  <option value="">— Select a user —</option>
                  {(adminCandidates ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}{u.email ? ` · ${u.email}` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Only shows users with the University Admin role. Create one first via User Management if the list is empty.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Title
                </label>
                <input
                  className={inputCls}
                  value={assign.title}
                  onChange={(e) => setAssign((a) => ({ ...a, title: e.target.value }))}
                  placeholder="Admissions Officer"
                />
              </div>
              {assignMut.isError && <p className="text-sm text-rose-600">Couldn't assign admin.</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-border/60 px-6 py-4">
              <button className={btn.outline} onClick={() => setAssignFor(null)}>
                Cancel
              </button>
              <button
                className={btn.primary}
                disabled={assignMut.isPending || !assign.profileId}
                onClick={() =>
                  assignMut.mutate({
                    id: assignFor.id,
                    profileId: assign.profileId,
                    title: assign.title,
                  })
                }
              >
                {assignMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminShell>
  );
}
