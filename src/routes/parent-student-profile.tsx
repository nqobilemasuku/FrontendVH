import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ParentShell } from "@/components/ParentShell";
import {
  User,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Lock,
  Mail,
  MapPin,
  Users,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  Panel,
  StatusPill,
  IconBadge,
  type Tone,
} from "@/components/dashboard/ui";
import { PanelSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parent-student-profile")({
  head: () => ({ meta: [{ title: "Student Profile · Varsity Hub" }] }),
  component: ParentStudentProfile,
});

type ChildItem = {
  id: string;
  fullName: string;
  aps: number | null;
  schoolName: string | null;
  grade: number | null;
  relationship: string | null;
};

type ChildDetail = {
  id: string;
  fullName: string;
  email: string | null;
  province: string | null;
  schoolName: string | null;
  grade: number | null;
  aps: number | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function ParentStudentProfile() {
  const [childId, setChildId] = useState<string | null>(null);

  const children = useQuery({
    queryKey: ["parent-children"],
    queryFn: () => api.get<ChildItem[]>("/api/parent/children"),
  });

  const list = children.data ?? [];
  const activeId = childId ?? list[0]?.id ?? null;

  const detail = useQuery({
    queryKey: ["parent-child", activeId],
    queryFn: () => api.get<ChildDetail>(`/api/parent/children/${activeId}`),
    enabled: !!activeId,
  });

  return (
    <ParentShellHeaderWrapped
      childCount={list.length}
      picker={
        list.length > 1 ? (
          <select
            value={activeId ?? ""}
            onChange={(e) => setChildId(e.target.value)}
            className="rounded-lg border border-border/70 bg-card px-3 py-2 text-sm font-medium shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            {list.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        ) : null
      }
    >
      {children.isLoading && <PanelSkeleton />}
      {children.isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load your linked learners.
        </div>
      )}
      {!children.isLoading && !children.isError && list.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
          <IconBadge icon={Users} tone="slate" className="mx-auto" />
          <p className="mt-4 text-sm font-semibold">No linked learners yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Once a learner links you as their guardian, their profile will appear here.
          </p>
        </div>
      )}

      {!children.isLoading && !children.isError && list.length > 0 && (
        <>
          {detail.isLoading && <PanelSkeleton />}
          {detail.isError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
              Couldn't load this learner's profile.
            </div>
          )}
          {detail.data && <ProfileBody d={detail.data} />}
        </>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
        <IconBadge icon={ShieldCheck} tone="emerald" />
        <div>
          <p className="text-sm font-semibold">Read only profile</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            This is a monitoring view. Your learner manages their own profile and documents from
            their student account.
          </p>
        </div>
      </div>
    </ParentShellHeaderWrapped>
  );
}

function ProfileBody({ d }: { d: ChildDetail }) {
  const personalDetails: { label: string; value: string; icon?: typeof User }[] = [
    { label: "Full Name", value: d.fullName },
    { label: "Province", value: d.province ?? "—", icon: MapPin },
    { label: "Email", value: d.email ?? "—", icon: Mail },
    { label: "Grade", value: d.grade != null ? String(d.grade) : "—" },
  ];
  const academicSummary = [
    { label: "School", value: d.schoolName ?? "—" },
    { label: "Grade", value: d.grade != null ? String(d.grade) : "—" },
    { label: "APS Score", value: d.aps != null ? String(d.aps) : "—" },
  ];

  return (
    <>
      <Panel tone="emerald">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-400 text-2xl font-bold text-white shadow-(--shadow-soft)">
            {initials(d.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold tracking-tight">{d.fullName}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {[d.grade != null ? `Grade ${d.grade}` : null, d.schoolName]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {d.aps != null && (
                <StatusPill tone="blue" dot={false}>
                  APS {d.aps}
                </StatusPill>
              )}
              {d.province && (
                <StatusPill tone="emerald" dot={false}>
                  {d.province}
                </StatusPill>
              )}
            </div>
          </div>
        </div>
      </Panel>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          icon={GraduationCap}
          tone="emerald"
          label="APS Score"
          value={d.aps ?? "—"}
          hint="Admission points"
        />
        <StatCard
          icon={User}
          tone="blue"
          label="Grade"
          value={d.grade ?? "—"}
          hint={d.schoolName ?? undefined}
        />
        <StatCard icon={BookOpen} tone="teal" label="Province" value={d.province ?? "—"} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Personal Details" icon={User} tone="emerald">
          <ul className="space-y-1">
            {personalDetails.map((row) => {
              const Icon = row.icon;
              return (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground/70" />}
                    {row.label}
                  </span>
                  <span className="text-sm font-medium text-foreground">{row.value}</span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Academic Summary" icon={GraduationCap} tone="teal">
          <ul className="space-y-1">
            {academicSummary.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40"
              >
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm font-medium text-foreground">{row.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

/** Wraps ParentShell + PageHeader so the picker sits in the header actions. */
function ParentShellHeaderWrapped({
  childCount,
  picker,
  children,
}: {
  childCount: number;
  picker: ReactNode;
  children: ReactNode;
}) {
  return (
    <ParentShell>
      <PageHeader
        eyebrow="Parent / Guardian"
        title="Student Profile"
        subtitle="Your learner's academic information · read only."
        icon={User}
        tone="emerald"
        actions={
          <div className="flex items-center gap-2">
            {picker}
            <StatusPill tone="slate" dot={false} className={cn(childCount === 0 && "hidden")}>
              <Lock className="h-3.5 w-3.5" />
              Read only view
            </StatusPill>
          </div>
        }
      />
      {children}
    </ParentShell>
  );
}
