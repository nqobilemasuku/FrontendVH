import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import { Users, Search, Ban, UserPlus, X, Loader2 } from "lucide-react";
import {
  PageHeader,
  Panel,
  StatusPill,
  table,
  toneClasses,
  btn,
  type Tone,
} from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-users")({
  head: () => ({ meta: [{ title: "User Management · Varsity Hub" }] }),
  component: AdminUsers,
});

type Role = "student" | "counsellor" | "parent" | "university_admin" | "super_admin";

type AdminUser = {
  id: string;
  role: Role | string;
  fullName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

const roles: Role[] = ["student", "counsellor", "parent", "university_admin", "super_admin"];

const roleLabels: Record<string, string> = {
  student: "Student",
  counsellor: "Counsellor",
  parent: "Parent",
  university_admin: "University Admin",
  super_admin: "Super Admin",
};

const roleTone: Record<string, Tone> = {
  student: "blue",
  parent: "emerald",
  counsellor: "indigo",
  university_admin: "sky",
  super_admin: "fuchsia",
};

const avatarTones = [
  "fuchsia",
  "blue",
  "indigo",
  "emerald",
  "sky",
  "violet",
  "teal",
  "amber",
  "rose",
  "cyan",
] as const;

function initials(name: string) {
  return name
    .replace(/(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s*/g, "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const selectCls =
  "rounded-lg border border-border/70 bg-card px-3 py-2 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25";

function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users", role, q],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (role) qs.set("role", role);
      if (q) qs.set("q", q);
      qs.set("page", "1");
      qs.set("pageSize", "50");
      return api.get<AdminUser[]>(`/api/admin/users?${qs.toString()}`);
    },
  });
  const users = data ?? [];
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(users, 10);

  const setRoleMut = useMutation({
    mutationFn: ({ id, role: r }: { id: string; role: string }) =>
      api.patch(`/api/admin/users/${id}/role`, { role: r }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/users/${id}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <SuperAdminShell>
      <PageHeader
        eyebrow="National Administration"
        title="User Management"
        subtitle="Manage all platform users across every role."
        icon={Users}
        tone="fuchsia"
        actions={
          <button className={btn.primary} onClick={() => setShowCreate(true)}>
            <UserPlus className="h-4 w-4" /> Create user
          </button>
        }
      />

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search users by name or email…"
            className="w-full rounded-lg border border-border/70 bg-card py-2.5 pl-9 pr-3 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {roleLabels[r]}
            </option>
          ))}
        </select>
      </div>

      <Panel flush>
        {isLoading && <TableSkeleton />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">Couldn't load users.</div>
        )}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto">
            <table className={table.el}>
              <thead className={table.thead}>
                <tr>
                  <th className={table.th}>User</th>
                  <th className={table.th}>Phone</th>
                  <th className={table.th}>Joined</th>
                  <th className={table.th}>Role</th>
                  <th className={cn(table.th, "text-right")}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((u, idx) => {
                  const av = toneClasses(avatarTones[idx % avatarTones.length]);
                  return (
                    <tr key={u.id} className={table.row}>
                      <td className={table.td}>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1",
                              av.soft,
                              av.text,
                              av.ring,
                            )}
                          >
                            {initials(u.fullName)}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium leading-tight">{u.fullName}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {u.email ?? "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={cn(table.td, "text-muted-foreground")}>{u.phone ?? "—"}</td>
                      <td className={cn(table.td, "text-muted-foreground")}>
                        {new Date(u.createdAt).toLocaleDateString("en-ZA", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className={table.td}>
                        <div className="flex items-center gap-2">
                          <StatusPill tone={roleTone[u.role] ?? "slate"} dot={false}>
                            {roleLabels[u.role] ?? u.role}
                          </StatusPill>
                          <select
                            value={u.role}
                            disabled={setRoleMut.isPending}
                            onChange={(e) => setRoleMut.mutate({ id: u.id, role: e.target.value })}
                            className={cn(selectCls, "py-1 text-xs")}
                          >
                            {roles.map((r) => (
                              <option key={r} value={r}>
                                {roleLabels[r]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className={cn(table.td, "text-right")}>
                        <button
                          type="button"
                          title="Deactivate"
                          disabled={deactivateMut.isPending}
                          onClick={() => deactivateMut.mutate(u.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-sm text-muted-foreground"
                    >
                      No users match your filters.
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
              noun="users"
            />
          </>
        )}
      </Panel>
    </SuperAdminShell>
  );
}

/* ------------------------------- Create user ------------------------------ */

type UniLite = { id: string; name: string; shortCode: string };

const fieldCls =
  "mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "student" as Role,
    studentId: "",
    relationship: "mother",
    universityId: "",
    title: "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const needsStudent = f.role === "counsellor" || f.role === "parent";
  const needsUniversity = f.role === "university_admin";

  // Pickers — only fetched when the chosen role needs a link.
  const { data: students } = useQuery({
    queryKey: ["admin-users", "student-picker"],
    enabled: needsStudent,
    queryFn: () => api.get<AdminUser[]>("/api/admin/users?role=student&page=1&pageSize=200"),
  });
  const { data: universities } = useQuery({
    queryKey: ["admin-universities", "picker"],
    enabled: needsUniversity,
    queryFn: () => api.get<UniLite[]>("/api/admin/universities"),
  });

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/api/admin/users", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't create the user."),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const body: Record<string, unknown> = {
      fullName: f.fullName.trim(),
      email: f.email.trim(),
      password: f.password,
      role: f.role,
      phone: f.phone.trim() || null,
    };
    if (f.role === "counsellor" && f.studentId) body.studentId = f.studentId;
    if (f.role === "parent") {
      if (f.studentId) body.studentId = f.studentId;
      body.relationship = f.relationship || null;
    }
    if (f.role === "university_admin") {
      body.universityId = f.universityId || null;
      body.title = f.title.trim() || null;
    }
    create.mutate(body);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
          <h2 className="text-lg font-bold">Create user</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <label className="text-xs font-semibold text-foreground">Full name</label>
            <input className={fieldCls} required value={f.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="e.g. Ms T. Dlamini" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Email</label>
              <input type="email" className={fieldCls} required value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Phone (optional)</label>
              <input className={fieldCls} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+27…" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground">Temporary password</label>
            <input type="text" className={fieldCls} required minLength={8} value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="Min 8 characters — share with the user" />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground">Role</label>
            <select
              className={fieldCls}
              value={f.role}
              onChange={(e) => set("role", e.target.value as Role)}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional link fields */}
          {needsStudent && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <label className="text-xs font-semibold text-foreground">
                {f.role === "parent" ? "Link to child (student)" : "Link to learner (caseload)"}
              </label>
              <select className={fieldCls} value={f.studentId} onChange={(e) => set("studentId", e.target.value)}>
                <option value="">— None for now —</option>
                {(students ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}{s.email ? ` · ${s.email}` : ""}
                  </option>
                ))}
              </select>
              {f.role === "parent" && (
                <div className="mt-3">
                  <label className="text-xs font-semibold text-foreground">Relationship</label>
                  <select className={fieldCls} value={f.relationship} onChange={(e) => set("relationship", e.target.value)}>
                    <option value="mother">Mother</option>
                    <option value="father">Father</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {needsUniversity && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <label className="text-xs font-semibold text-foreground">Link to university</label>
              <select className={fieldCls} value={f.universityId} onChange={(e) => set("universityId", e.target.value)}>
                <option value="">— Select a university —</option>
                {(universities ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.shortCode})
                  </option>
                ))}
              </select>
              <div className="mt-3">
                <label className="text-xs font-semibold text-foreground">Title (optional)</label>
                <input className={fieldCls} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Admissions Officer" />
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className={btn.outline}>
              Cancel
            </button>
            <button type="submit" disabled={create.isPending} className={btn.primary}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create user
            </button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            The account is created auto-confirmed — the user can log in immediately with these credentials.
          </p>
        </form>
      </div>
    </div>
  );
}
