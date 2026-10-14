import type { ReactNode } from "react";
import {
  LayoutDashboard,
  User,
  FileText,
  BookOpen,
  CalendarDays,
  Bell,
  HelpCircle,
} from "lucide-react";
import { DashboardShell, type DashboardShellConfig } from "@/components/dashboard/DashboardShell";

const config: DashboardShellConfig = {
  portalLabel: "PARENT PORTAL",
  accent: "emerald",
  homePath: "/parent-dashboard",
  requireRole: "parent",
  user: { name: "Sarah Khumalo", role: "Parent / Guardian" },
  searchPlaceholder: "Search applications…",
  notificationCount: 2,
  nav: [
    {
      label: "Overview",
      items: [
        { to: "/parent-dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/parent-student-profile", label: "Student Profile", icon: User },
      ],
    },
    {
      label: "Applications",
      items: [
        { to: "/parent-applications", label: "Applications", icon: FileText },
        { to: "/parent-programmes", label: "Programme Choices", icon: BookOpen },
        { to: "/parent-deadlines", label: "Deadlines", icon: CalendarDays },
      ],
    },
    {
      label: "Account",
      items: [
        { to: "/parent-notifications", label: "Notifications", icon: Bell, badge: 2 },
        { to: "/parent-help", label: "Help & Support", icon: HelpCircle },
      ],
    },
  ],
};

export function ParentShell({ children }: { children: ReactNode }) {
  return <DashboardShell config={config}>{children}</DashboardShell>;
}
