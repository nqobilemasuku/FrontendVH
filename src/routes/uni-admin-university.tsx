/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UniversityAdminShell } from "@/components/UniversityAdminShell";
import { Landmark, Save, Loader2, CheckCircle2 } from "lucide-react";
import { PageHeader, Panel, btn } from "@/components/dashboard/ui";
import { PanelSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";

export const Route = createFileRoute("/uni-admin-university")({
  head: () => ({ meta: [{ title: "My University · Varsity Hub" }] }),
  component: UniAdminUniversity,
});

type MyUniversity = {
  id: string;
  name: string;
  shortCode: string;
  province: string | null;
  domain: string | null;
  website: string | null;
  logoUrl?: string | null;
};

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "Northern Cape", "North West", "Western Cape",
];

const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:bg-muted/50";

type FormState = {
  name: string;
  province: string;
  domain: string;
  website: string;
  logoUrl: string;
};

function UniAdminUniversity() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["uni-admin-universities"],
    queryFn: () => api.get<MyUniversity[]>("/api/uni-admin/universities"),
  });
  const uni = data?.[0] ?? null;

  useEffect(() => {
    if (uni) {
      setForm({
        name: uni.name ?? "",
        province: uni.province ?? "",
        domain: uni.domain ?? "",
        website: uni.website ?? "",
        logoUrl: uni.logoUrl ?? "",
      });
    }
  }, [uni]);

  const save = useMutation({
    mutationFn: (body: FormState) =>
      api.patch(`/api/uni-admin/universities/${uni!.id}`, {
        name: body.name || null,
        province: body.province || null,
        domain: body.domain || null,
        website: body.website || null,
        logoUrl: body.logoUrl || null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["uni-admin-universities"] }),
  });

  return (
    <UniversityAdminShell>
      <PageHeader
        eyebrow="Overview"
        title="My University"
        subtitle="Update your institution's public profile."
        icon={Landmark}
        tone="blue"
      />

      {isLoading && <PanelSkeleton />}
      {isError && (
        <Panel>
          <p className="py-10 text-center text-sm text-rose-600">Couldn't load your university.</p>
        </Panel>
      )}
      {!isLoading && !isError && !uni && (
        <Panel>
          <p className="py-10 text-center text-sm text-muted-foreground">
            No university is linked to your account. Ask a super administrator to assign you to one.
          </p>
        </Panel>
      )}

      {form && uni && (
        <Panel className="max-w-2xl">
          {save.isSuccess && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Your university profile has been updated.
            </div>
          )}
          {save.isError && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Couldn't save your changes. Please try again.
            </div>
          )}

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">University name</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => f && { ...f, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Short code</label>
                <input className={inputCls} value={uni.shortCode ?? ""} disabled title="Managed by a super administrator" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Province</label>
                <select className={inputCls} value={form.province} onChange={(e) => setForm((f) => f && { ...f, province: e.target.value })}>
                  <option value="">— Select province —</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email domain</label>
                <input className={inputCls} value={form.domain} onChange={(e) => setForm((f) => f && { ...f, domain: e.target.value })} placeholder="uj.ac.za" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Website</label>
              <input className={inputCls} value={form.website} onChange={(e) => setForm((f) => f && { ...f, website: e.target.value })} placeholder="https://www.uj.ac.za" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Logo URL</label>
              <input className={inputCls} value={form.logoUrl} onChange={(e) => setForm((f) => f && { ...f, logoUrl: e.target.value })} placeholder="https://…/logo.png" />
              {form.logoUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    loading="lazy"
                    className="h-12 w-12 rounded-lg border border-border/60 bg-white object-contain p-1"
                  />
                  <span className="text-xs text-muted-foreground">Logo preview</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-7 flex justify-end border-t border-border/60 pt-5">
            <button
              className={btn.primary}
              disabled={save.isPending || !form.name.trim()}
              onClick={() => save.mutate(form)}
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
            </button>
          </div>
        </Panel>
      )}
    </UniversityAdminShell>
  );
}
