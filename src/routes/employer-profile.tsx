/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmployerShell } from "@/components/EmployerShell";
import { Building2, Save, Loader2, CheckCircle2, BadgeCheck, Clock } from "lucide-react";
import { PageHeader, Panel, StatusPill, btn } from "@/components/dashboard/ui";
import { PanelSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";

export const Route = createFileRoute("/employer-profile")({
  head: () => ({ meta: [{ title: "Company Profile · Varsity Hub" }] }),
  component: EmployerProfilePage,
});

type EmployerProfile = {
  id: string;
  companyName: string;
  website: string | null;
  logoUrl: string | null;
  isVerified: boolean;
};

const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25";

type FormState = { companyName: string; website: string; logoUrl: string };

function EmployerProfilePage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["employer-profile"],
    queryFn: () => api.get<EmployerProfile>("/api/employer/profile"),
  });

  useEffect(() => {
    if (data) {
      setForm({
        companyName: data.companyName ?? "",
        website: data.website ?? "",
        logoUrl: data.logoUrl ?? "",
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: (body: FormState) =>
      api.patch("/api/employer/profile", {
        companyName: body.companyName || null,
        website: body.website || null,
        logoUrl: body.logoUrl || null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employer-profile"] }),
  });

  return (
    <EmployerShell>
      <PageHeader
        eyebrow="Overview"
        title="Company Profile"
        subtitle="This is how students see your organisation on the Job Hub."
        icon={Building2}
        tone="indigo"
        actions={
          data &&
          (data.isVerified ? (
            <StatusPill tone="emerald"><BadgeCheck className="h-3.5 w-3.5" /> Verified</StatusPill>
          ) : (
            <StatusPill tone="amber"><Clock className="h-3.5 w-3.5" /> Pending verification</StatusPill>
          ))
        }
      />

      {isLoading && <PanelSkeleton />}
      {isError && (
        <Panel>
          <p className="py-10 text-center text-sm text-rose-600">Couldn't load your company profile.</p>
        </Panel>
      )}

      {form && (
        <Panel className="max-w-2xl">
          {save.isSuccess && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Your company profile has been updated.
            </div>
          )}
          {save.isError && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Couldn't save your changes. Please try again.
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Company name</label>
              <input className={inputCls} value={form.companyName} onChange={(e) => setForm((f) => f && { ...f, companyName: e.target.value })} placeholder="Acme (Pty) Ltd" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Website</label>
              <input className={inputCls} value={form.website} onChange={(e) => setForm((f) => f && { ...f, website: e.target.value })} placeholder="https://www.acme.co.za" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Logo URL</label>
              <input className={inputCls} value={form.logoUrl} onChange={(e) => setForm((f) => f && { ...f, logoUrl: e.target.value })} placeholder="https://…/logo.png" />
              {form.logoUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={form.logoUrl} alt="Logo preview" loading="lazy" className="h-12 w-12 rounded-lg border border-border/60 bg-white object-contain p-1" />
                  <span className="text-xs text-muted-foreground">Logo preview</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-7 flex justify-end border-t border-border/60 pt-5">
            <button className={btn.primary} disabled={save.isPending || !form.companyName.trim()} onClick={() => save.mutate(form)}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
            </button>
          </div>
        </Panel>
      )}
    </EmployerShell>
  );
}
