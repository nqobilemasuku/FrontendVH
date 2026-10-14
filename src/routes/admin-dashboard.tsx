import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import {
  Users,
  Building2,
  ClipboardList,
  Banknote,
  GraduationCap,
  Compass,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { StatCard, Panel, BarRow, type Tone } from "@/components/dashboard/ui";
import { StatCardsSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin-dashboard")({
  head: () => ({ meta: [{ title: "Platform Dashboard · Varsity Hub" }] }),
  component: AdminDashboard,
});

type AdminSummary = {
  students: number;
  counsellors: number;
  parents: number;
  uniAdmins: number;
  superAdmins: number;
  applications: number;
  universities: number;
  revenue: number;
};

const roleMeta: { key: keyof AdminSummary; label: string; icon: typeof Users; tone: Tone }[] = [
  { key: "students", label: "Students", icon: GraduationCap, tone: "blue" },
  { key: "counsellors", label: "Counsellors", icon: Compass, tone: "indigo" },
  { key: "parents", label: "Parents", icon: Heart, tone: "emerald" },
  { key: "uniAdmins", label: "University Admins", icon: Building2, tone: "sky" },
  { key: "superAdmins", label: "Super Admins", icon: ShieldCheck, tone: "fuchsia" },
];

function AdminDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-summary"],
    queryFn: () => api.get<AdminSummary>("/api/admin/summary"),
  });

  const totalUsers =
    data != null
      ? data.students + data.counsellors + data.parents + data.uniAdmins + data.superAdmins
      : 0;
  const roleMax = data != null ? Math.max(...roleMeta.map((r) => Number(data[r.key]) || 0), 1) : 1;

  return (
    <SuperAdminShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            National Administration
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Varsity Hub platform overview.</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-fuchsia-50 px-3 py-1.5 text-xs font-semibold text-fuchsia-600 ring-1 ring-fuchsia-100">
          {new Date().getFullYear()} Academic Year
        </span>
      </div>

      {isLoading && <StatCardsSkeleton />}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load the platform overview right now. Please try again shortly.
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Users"
              value={totalUsers.toLocaleString()}
              tone="fuchsia"
              hint="across all roles"
            />
            <StatCard
              icon={Building2}
              label="Universities"
              value={(data.universities ?? 0).toLocaleString()}
              tone="indigo"
              hint="registered partners"
            />
            <StatCard
              icon={ClipboardList}
              label="Applications"
              value={(data.applications ?? 0).toLocaleString()}
              tone="amber"
              hint="platform wide"
            />
            <StatCard
              icon={Banknote}
              label="Revenue"
              value={`R ${(data.revenue ?? 0).toLocaleString()}`}
              tone="emerald"
              hint="total to date"
            />
          </div>

          <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
            <Panel title="Users by Role" icon={Users} tone="fuchsia">
              <div className="space-y-3">
                {roleMeta.map((r) => (
                  <BarRow
                    key={r.key}
                    label={r.label}
                    value={Number(data[r.key]) || 0}
                    max={roleMax}
                    tone={r.tone}
                    valueLabel={(Number(data[r.key]) || 0).toLocaleString()}
                    labelWidth="w-40"
                  />
                ))}
              </div>
            </Panel>

            <Panel title="Role Breakdown" icon={GraduationCap} tone="fuchsia">
              <div className="grid grid-cols-2 gap-3">
                {roleMeta.map((r) => (
                  <StatCard
                    key={r.key}
                    icon={r.icon}
                    label={r.label}
                    value={(Number(data[r.key]) || 0).toLocaleString()}
                    tone={r.tone}
                  />
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
    </SuperAdminShell>
  );
}
