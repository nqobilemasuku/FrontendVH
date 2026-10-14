import type { ReactNode } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  FileSearch,
  FolderOpen,
  BookOpen,
  GraduationCap,
  Building2,
  Landmark,
  PiggyBank,
  ToggleLeft,
  BarChart3,
  Bell,
} from "lucide-react";
import { DashboardShell, type DashboardShellConfig } from "@/components/dashboard/DashboardShell";

const config: DashboardShellConfig = {
  portalLabel: "UNIVERSITY PORTAL",
  accent: "blue",
  homePath: "/uni-admin-dashboard",
  requireRole: "university_admin",
  user: { name: "Dr. M. Mokoena", role: "University Administrator" },
  searchPlaceholder: "Search applicants…",
  notificationCount: 5,
  nav: [
    {
      label: "Overview",
      items: [
        { to: "/uni-admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/uni-admin-university", label: "My University", icon: Landmark },
      ],
    },
    {
      label: "Catalogue",
      items: [
        { to: "/uni-admin-programmes", label: "Programmes", icon: GraduationCap },
        { to: "/uni-admin-faculties", label: "Faculties", icon: Building2 },
        { to: "/uni-admin-bursaries", label: "Bursaries", icon: PiggyBank },
      ],
    },
    {
      label: "Admissions",
      items: [
        { to: "/uni-admin-applications", label: "Applications", icon: ClipboardList },
        { to: "/uni-admin-application-details", label: "Application Details", icon: FileSearch },
        { to: "/uni-admin-documents", label: "Documents", icon: FolderOpen },
        { to: "/uni-admin-programme-apps", label: "By Programme", icon: BookOpen },
        { to: "/uni-admin-status", label: "Status Management", icon: ToggleLeft },
      ],
    },
    {
      label: "Insights",
      items: [
        { to: "/uni-admin-reports", label: "Reports", icon: BarChart3 },
        { to: "/uni-admin-notifications", label: "Notifications", icon: Bell, badge: 5 },
      ],
    },
  ],
};

export function UniversityAdminShell({ children }: { children: ReactNode }) {
  return <DashboardShell config={config}>{children}</DashboardShell>;
}
