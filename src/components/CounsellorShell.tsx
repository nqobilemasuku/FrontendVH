import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Award,
  Compass,
  FileText,
  AlertTriangle,
  BarChart3,
  Bell,
} from "lucide-react";
import { DashboardShell, type DashboardShellConfig } from "@/components/dashboard/DashboardShell";

const config: DashboardShellConfig = {
  portalLabel: "COUNSELLOR PORTAL",
  accent: "indigo",
  homePath: "/counsellor-dashboard",
  requireRole: "counsellor",
  user: { name: "Mr. T. Dlamini", role: "School Counsellor" },
  searchPlaceholder: "Search learners…",
  notificationCount: 4,
  nav: [
    {
      label: "Overview",
      items: [{ to: "/counsellor-dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Learners",
      items: [
        { to: "/counsellor-learners", label: "Learners", icon: Users },
        { to: "/counsellor-aps-results", label: "APS & Results", icon: GraduationCap },
        { to: "/counsellor-recommendations", label: "Recommendations", icon: Award },
        { to: "/counsellor-career", label: "Career Guidance", icon: Compass },
      ],
    },
    {
      label: "Applications",
      items: [
        { to: "/counsellor-applications", label: "Applications", icon: FileText },
        { to: "/counsellor-missing-docs", label: "Missing Docs", icon: AlertTriangle, badge: 8 },
      ],
    },
    {
      label: "Insights",
      items: [
        { to: "/counsellor-reports", label: "Reports", icon: BarChart3 },
        { to: "/counsellor-notifications", label: "Notifications", icon: Bell, badge: 4 },
      ],
    },
  ],
};

export function CounsellorShell({ children }: { children: ReactNode }) {
  return <DashboardShell config={config}>{children}</DashboardShell>;
}
