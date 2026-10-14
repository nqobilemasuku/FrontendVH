import type { ReactNode } from "react";
import { LayoutDashboard, Briefcase, Users, Building2 } from "lucide-react";
import { DashboardShell, type DashboardShellConfig } from "@/components/dashboard/DashboardShell";

const config: DashboardShellConfig = {
  portalLabel: "EMPLOYER PORTAL",
  accent: "indigo",
  homePath: "/employer-dashboard",
  requireRole: "employer",
  user: { name: "Employer", role: "Employer" },
  searchPlaceholder: "Search your jobs…",
  nav: [
    {
      label: "Overview",
      items: [
        { to: "/employer-dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/employer-profile", label: "Company Profile", icon: Building2 },
      ],
    },
    {
      label: "Recruiting",
      items: [
        { to: "/employer-jobs", label: "My Jobs", icon: Briefcase },
        { to: "/employer-applicants", label: "Applicants", icon: Users },
      ],
    },
  ],
};

export function EmployerShell({ children }: { children: ReactNode }) {
  return <DashboardShell config={config}>{children}</DashboardShell>;
}
