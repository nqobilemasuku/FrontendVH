import type { ReactNode } from "react";
import {
  LayoutDashboard,
  User,
  GraduationCap,
  BookOpen,
  Compass,
  FileText,
  MessageSquare,
  FolderOpen,
  Settings,
  HelpCircle,
  Briefcase,
  Store,
  PiggyBank,
  CalendarDays,
  Home,
  Mic,
  Bell,
  Building2,
} from "lucide-react";
import { DashboardShell, type DashboardShellConfig } from "@/components/dashboard/DashboardShell";

const config: DashboardShellConfig = {
  portalLabel: "STUDENT PORTAL",
  accent: "primary",
  homePath: "/dashboard",
  requireRole: "student",
  user: { name: "Lindiwe Nkosi", role: "Student" },
  searchPlaceholder: "Search programmes, jobs, bursaries…",
  notificationCount: 5,
  nav: [
    {
      label: "Overview",
      items: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/profile", label: "My Profile", icon: User },
        { to: "/academic-results", label: "Academic Results", icon: GraduationCap },
        { to: "/notifications", label: "Notifications", icon: Bell, badge: 5 },
      ],
    },
    {
      label: "Explore",
      items: [
        { to: "/browse-universities", label: "Universities", icon: Building2 },
        { to: "/programme-search", label: "Programmes", icon: BookOpen },
        { to: "/career-guidance", label: "Career Guidance", icon: Compass },
      ],
    },
    {
      label: "Applications",
      items: [
        { to: "/applications", label: "Applications", icon: FileText },
        { to: "/documents", label: "Documents", icon: FolderOpen },
        { to: "/messages", label: "Messages", icon: MessageSquare, badge: 2 },
      ],
    },
    {
      label: "Opportunities",
      items: [
        { to: "/job-hub", label: "Job Hub", icon: Briefcase },
        { to: "/bursaries", label: "Bursary Hub", icon: PiggyBank },
        { to: "/marketplace", label: "Market Hub", icon: Store },
        { to: "/events", label: "Events Hub", icon: CalendarDays },
        { to: "/accommodation", label: "Accommodation", icon: Home },
        { to: "/interview-practice", label: "Interview Practice", icon: Mic },
      ],
    },
    {
      label: "Account",
      items: [
        { to: "/settings", label: "Settings", icon: Settings },
        { to: "/help", label: "Help & Support", icon: HelpCircle },
      ],
    },
  ],
};

export function StudentShell({ children }: { children: ReactNode }) {
  return <DashboardShell config={config}>{children}</DashboardShell>;
}
