import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  Calculator,
  ClipboardList,
  Briefcase,
  GraduationCap,
  BarChart3,
  Bell,
  Settings,
  ScrollText,
  CalendarDays,
  Home,
} from "lucide-react";
import { DashboardShell, type DashboardShellConfig } from "@/components/dashboard/DashboardShell";

const config: DashboardShellConfig = {
  portalLabel: "ADMIN PORTAL",
  accent: "fuchsia",
  homePath: "/admin-dashboard",
  requireRole: "super_admin",
  user: { name: "Thandi Nkosi", role: "Super Administrator" },
  searchPlaceholder: "Search users, universities…",
  notificationCount: 7,
  nav: [
    {
      label: "Overview",
      items: [{ to: "/admin-dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Management",
      items: [
        { to: "/admin-users", label: "User Management", icon: Users },
        { to: "/admin-universities", label: "Universities", icon: Building2 },
        { to: "/admin-programmes", label: "Programmes", icon: BookOpen },
        { to: "/admin-aps-rules", label: "APS Rules", icon: Calculator },
        { to: "/admin-applications", label: "Applications", icon: ClipboardList },
      ],
    },
    {
      label: "Opportunities",
      items: [
        { to: "/admin-jobs", label: "Jobs", icon: Briefcase },
        { to: "/admin-bursaries", label: "Bursaries", icon: GraduationCap },
      ],
    },
    {
      label: "Content",
      items: [
        { to: "/admin-events", label: "Events", icon: CalendarDays },
        { to: "/admin-accommodations", label: "Accommodation", icon: Home },
        { to: "/admin-faculties", label: "Faculties", icon: Building2 },
      ],
    },
    {
      label: "Insights",
      items: [
        { to: "/admin-reports", label: "Reports & Analytics", icon: BarChart3 },
        { to: "/admin-notifications", label: "Notifications", icon: Bell, badge: 7 },
      ],
    },
    {
      label: "System",
      items: [
        { to: "/admin-settings", label: "System Settings", icon: Settings },
        { to: "/admin-audit-logs", label: "Audit Logs", icon: ScrollText },
      ],
    },
  ],
};

export function SuperAdminShell({ children }: { children: ReactNode }) {
  return <DashboardShell config={config}>{children}</DashboardShell>;
}
