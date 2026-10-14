import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import { Calculator, Plus, Pencil, X, Loader2 } from "lucide-react";
import { PageHeader, Panel, StatusPill, btn } from "@/components/dashboard/ui";
import { ListSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-aps-rules")({
  head: () => ({ meta: [{ title: "APS Rules Configuration · Varsity Hub" }] }),
  component: AdminApsRules,
});

type ApsRuleDto = {
  id: string;
  universityId: string | null;
  name: string;
  description: string | null;
  config: string;
  isActive: boolean;
};

function prettyJson(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25";

type FormState = {
  universityId: string;
  name: string;
  description: string;
  config: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  universityId: "",
  name: "",
  description: "",
  config: "{}",
  isActive: true,
};

function AdminApsRules() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApsRuleDto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-aps-rules"],
    queryFn: () => api.get<ApsRuleDto[]>("/api/admin/aps-rules"),
  });
  const rules = data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-aps-rules"] });

  const createMut = useMutation({
    mutationFn: (f: FormState) =>
      api.post("/api/admin/aps-rules", {
        universityId: f.universityId || undefined,
        name: f.name,
        description: f.description || undefined,
        config: f.config || undefined,
      }),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, f }: { id: string; f: FormState }) =>
      api.patch(`/api/admin/aps-rules/${id}`, {
        name: f.name,
        description: f.description || null,
        config: f.config,
        isActive: f.isActive,
      }),
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
  function openEdit(r: ApsRuleDto) {
    setEditing(r);
    setForm({
      universityId: r.universityId ?? "",
      name: r.name,
      description: r.description ?? "",
      config: prettyJson(r.config),
      isActive: r.isActive,
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
        title="APS Rules Configuration"
        subtitle="Configure APS calculation rules that apply platform wide or per university."
        icon={Calculator}
        tone="fuchsia"
        actions={
          <button className={btn.primary} onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Rule
          </button>
        }
      />

      {isLoading && <ListSkeleton />}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load APS rules.
        </div>
      )}
      {!isLoading && !isError && (
        <div className="space-y-4">
          {rules.map((r) => (
            <Panel
              key={r.id}
              title={r.name}
              description={r.universityId ? `University: ${r.universityId}` : "Platform wide"}
              icon={Calculator}
              tone="fuchsia"
              action={
                <div className="flex items-center gap-2">
                  <StatusPill tone={r.isActive ? "emerald" : "slate"}>
                    {r.isActive ? "Active" : "Inactive"}
                  </StatusPill>
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => openEdit(r)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              }
            >
              {r.description && (
                <p className="mb-3 text-sm text-muted-foreground">{r.description}</p>
              )}
              <pre className="overflow-x-auto rounded-lg border border-border/70 bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground">
                {prettyJson(r.config)}
              </pre>
            </Panel>
          ))}
          {rules.length === 0 && (
            <div className="rounded-2xl border border-border/70 bg-card p-12 text-center text-sm text-muted-foreground">
              No APS rules configured yet.
            </div>
          )}
        </div>
      )}

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
              <h2 className="text-lg font-bold">{editing ? "Edit APS Rule" : "Add APS Rule"}</h2>
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
                  placeholder="Standard APS Rule"
                />
              </div>
              {!editing && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    University ID (optional)
                  </label>
                  <input
                    className={inputCls}
                    value={form.universityId}
                    onChange={(e) => setForm((f) => ({ ...f, universityId: e.target.value }))}
                    placeholder="Leave blank for platform wide"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Description
                </label>
                <input
                  className={inputCls}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Config (JSON)
                </label>
                <textarea
                  rows={10}
                  className={cn(inputCls, "resize-y font-mono text-xs")}
                  value={form.config}
                  onChange={(e) => setForm((f) => ({ ...f, config: e.target.value }))}
                />
              </div>
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
                <p className="text-sm text-rose-600">Couldn't save the rule.</p>
              )}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border/60 bg-card px-6 py-4">
              <button className={btn.outline} onClick={closeForm}>
                Cancel
              </button>
              <button className={btn.primary} disabled={saving || !form.name} onClick={submitForm}>
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
