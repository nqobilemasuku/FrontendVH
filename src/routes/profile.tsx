/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentShell } from "@/components/StudentShell";
import {
  User,
  Pencil,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  CheckCircle2,
  ShieldCheck,
  X,
  Save,
  Loader2,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  StatusPill,
  btn,
} from "@/components/dashboard/ui";
import { PanelSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · Varsity Hub" }] }),
  component: Profile,
});

type MeProfile = {
  id: string;
  role: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  studentType: string | null;
  province: string | null;
  schoolName: string | null;
  grade: string | null;
};

type UpdateProfile = {
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  province: string | null;
  schoolName: string | null;
  grade: string | null;
};

const fieldCls =
  "mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground";

function initialsOf(name: string) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Profile() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateProfile | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<MeProfile>("/api/me"),
  });

  useEffect(() => {
    if (data && !editing) {
      setForm({
        fullName: data.fullName ?? "",
        phone: data.phone ?? "",
        avatarUrl: data.avatarUrl ?? "",
        province: data.province ?? "",
        schoolName: data.schoolName ?? "",
        grade: data.grade ?? "",
      });
    }
  }, [data, editing]);

  const save = useMutation({
    mutationFn: (body: UpdateProfile) => api.patch<MeProfile>("/api/me", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      setEditing(false);
    },
  });

  function set<K extends keyof UpdateProfile>(key: K, value: UpdateProfile[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  return (
    <StudentShell>
      <PageHeader
        icon={User}
        eyebrow="My Account"
        title="My Profile"
        subtitle="Manage your personal information and keep your details up to date."
        actions={
          editing ? (
            <>
              <button className={btn.ghost} onClick={() => setEditing(false)} disabled={save.isPending}>
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                className={btn.primary}
                onClick={() => form && save.mutate(form)}
                disabled={save.isPending}
              >
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </button>
            </>
          ) : (
            <button className={btn.outline} onClick={() => setEditing(true)} disabled={!data}>
              <Pencil className="h-4 w-4" /> Edit Profile
            </button>
          )
        }
      />

      {isLoading && <PanelSkeleton />}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load your profile.
        </div>
      )}

      {!isLoading && !isError && data && form && (
        <>
          {save.isError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              Couldn't save your changes. Please try again.
            </div>
          )}

          {/* Identity card */}
          <Panel className="overflow-hidden" bodyClassName="p-0">
            <div className="relative">
              <div className="h-24 bg-gradient-brand-soft sm:h-28">
                <div className="bg-dots absolute inset-0 h-24 opacity-50 sm:h-28" />
              </div>
              <div className="flex flex-col gap-5 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="relative -mt-12 shrink-0">
                    {data.avatarUrl ? (
                      <img
                        src={data.avatarUrl}
                        alt={data.fullName}
                        loading="lazy"
                        className="h-24 w-24 rounded-2xl object-cover shadow-(--shadow-md) ring-4 ring-card"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-brand-cyan text-2xl font-bold text-white shadow-(--shadow-md) ring-4 ring-card">
                        {initialsOf(data.fullName)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold tracking-tight">{data.fullName}</h2>
                    <p className="text-sm text-muted-foreground">{data.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.grade && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          <GraduationCap className="h-3.5 w-3.5 text-primary" /> {data.grade}
                        </span>
                      )}
                      {data.province && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> {data.province}
                        </span>
                      )}
                      {data.studentType && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground capitalize">
                          <User className="h-3.5 w-3.5 text-primary" /> {data.studentType.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <StatusPill tone={data.emailVerified ? "emerald" : "amber"} dot={false}>
                    <Mail className="h-3.5 w-3.5" /> {data.emailVerified ? "Email verified" : "Email unverified"}
                  </StatusPill>
                  <StatusPill tone={data.phoneVerified ? "emerald" : "amber"} dot={false}>
                    <Phone className="h-3.5 w-3.5" /> {data.phoneVerified ? "Phone verified" : "Phone unverified"}
                  </StatusPill>
                </div>
              </div>
            </div>
          </Panel>

          {/* Editable detail grid */}
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <Panel icon={User} title="Personal Information" description="Your identity details">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Full name</label>
                  <input
                    className={fieldCls}
                    disabled={!editing}
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Grade</label>
                  <input
                    className={fieldCls}
                    disabled={!editing}
                    value={form.grade ?? ""}
                    onChange={(e) => set("grade", e.target.value)}
                    placeholder="e.g. Grade 12"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Province</label>
                  <input
                    className={fieldCls}
                    disabled={!editing}
                    value={form.province ?? ""}
                    onChange={(e) => set("province", e.target.value)}
                    placeholder="e.g. Gauteng"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">School</label>
                  <input
                    className={fieldCls}
                    disabled={!editing}
                    value={form.schoolName ?? ""}
                    onChange={(e) => set("schoolName", e.target.value)}
                    placeholder="Your school name"
                  />
                </div>
              </div>
            </Panel>

            <Panel icon={Mail} title="Contact Information" tone="blue" description="How universities reach you">
              <div className="grid gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Email address</label>
                  <input className={fieldCls} disabled value={data.email} />
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ShieldCheck className="h-3 w-3" /> Email is managed via account security.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Mobile number</label>
                  <input
                    className={fieldCls}
                    disabled={!editing}
                    value={form.phone ?? ""}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+27 82 123 4567"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Avatar URL</label>
                  <input
                    className={fieldCls}
                    disabled={!editing}
                    value={form.avatarUrl ?? ""}
                    onChange={(e) => set("avatarUrl", e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </div>
            </Panel>
          </div>

          <Panel className="mt-6" tone="emerald">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <h4 className="font-semibold">Keep your profile current</h4>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Accurate details help us match you with the right programmes and bursaries.
                </p>
              </div>
            </div>
          </Panel>
        </>
      )}
    </StudentShell>
  );
}
