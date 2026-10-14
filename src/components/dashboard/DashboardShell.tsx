/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, Loader2 } from "lucide-react";
import markAsset from "@/assets/logo.png";
import { useEffect, type ComponentType, type CSSProperties, type ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth, HOME_BY_ROLE, type Role } from "@/lib/auth";
import { SearchInput } from "./ui";

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  counsellor: "School Counsellor",
  parent: "Parent / Guardian",
  university_admin: "University Administrator",
  super_admin: "Super Administrator",
  employer: "Employer",
};

type IconType = ComponentType<{ className?: string }>;

export type AccentKey = "primary" | "emerald" | "indigo" | "blue" | "fuchsia";

const accents: Record<
  AccentKey,
  { avatar: string; navActive: string; pill: string; ring: string }
> = {
  primary: {
    avatar: "from-primary to-brand-cyan",
    navActive:
      "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:before:bg-primary",
    pill: "bg-primary/10 text-primary",
    ring: "ring-primary/20",
  },
  emerald: {
    avatar: "from-emerald-500 to-teal-400",
    navActive:
      "data-[active=true]:bg-emerald-50 data-[active=true]:text-emerald-700 data-[active=true]:before:bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-600",
    ring: "ring-emerald-200",
  },
  indigo: {
    avatar: "from-indigo-500 to-purple-400",
    navActive:
      "data-[active=true]:bg-indigo-50 data-[active=true]:text-indigo-700 data-[active=true]:before:bg-indigo-500",
    pill: "bg-indigo-50 text-indigo-600",
    ring: "ring-indigo-200",
  },
  blue: {
    avatar: "from-blue-600 to-cyan-400",
    navActive:
      "data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 data-[active=true]:before:bg-blue-500",
    pill: "bg-blue-50 text-blue-600",
    ring: "ring-blue-200",
  },
  fuchsia: {
    avatar: "from-fuchsia-600 to-pink-500",
    navActive:
      "data-[active=true]:bg-fuchsia-50 data-[active=true]:text-fuchsia-700 data-[active=true]:before:bg-fuchsia-500",
    pill: "bg-fuchsia-50 text-fuchsia-600",
    ring: "ring-fuchsia-200",
  },
};

export type ShellNavItem = { to: string; label: string; icon: IconType; badge?: string | number };
export type ShellNavGroup = { label?: string; items: ShellNavItem[] };

export type DashboardShellConfig = {
  portalLabel: string;
  accent: AccentKey;
  homePath: string;
  user: { name: string; role: string };
  nav: ShellNavGroup[];
  searchPlaceholder?: string;
  notificationCount?: number;
  /** Role this portal requires. Non-matching users are redirected to their own dashboard. */
  requireRole?: Role;
};

const HONORIFICS = new Set(["mr", "mrs", "ms", "dr", "prof", "miss"]);
function initials(name: string) {
  const parts = name
    .replace(/\./g, "")
    .split(/\s+/)
    .filter((p) => p && !HONORIFICS.has(p.toLowerCase()));
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function ShellSidebar({ config }: { config: DashboardShellConfig }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const accent = accents[config.accent];
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate({ to: "/login", replace: true });
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link
          to="/login"
          aria-label="Varsity Hub · back to login"
          className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-sidebar-accent"
        >
          <img src={markAsset} alt="" loading="lazy" className="h-9 w-9 shrink-0 object-contain" />
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline gap-1">
                <span className="text-[15px] font-extrabold tracking-wide text-gradient-brand">
                  VARSITY
                </span>
                <span className="text-[15px] font-extrabold tracking-wide text-brand-cyan">
                  HUB
                </span>
              </div>
              <span
                className={cn(
                  "mt-1 inline-flex w-fit rounded-full px-1.5 py-0.5 text-[8px] font-bold tracking-[0.12em]",
                  accent.pill,
                )}
              >
                {config.portalLabel}
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1.5 py-1">
        {config.nav.map((group, gi) => (
          <SidebarGroup key={group.label ?? gi} className="py-1">
            {group.label && !collapsed && (
              <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.to ||
                    (item.to !== config.homePath && pathname.startsWith(item.to));
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className={cn(
                          "relative my-0.5 text-[13px] font-medium text-sidebar-foreground/75 transition-colors before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.75 before:-translate-y-1/2 before:rounded-r-full before:bg-transparent data-[active=true]:font-semibold",
                          accent.navActive,
                        )}
                      >
                        <Link to={item.to as any}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {item.badge != null && (
                            <span className="ml-auto rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 group-data-[collapsible=icon]:hidden">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-1 border-t border-sidebar-border p-1.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function DashboardShell({
  config,
  children,
}: {
  config: DashboardShellConfig;
  children: ReactNode;
}) {
  const accent = accents[config.accent];
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();

  // Live unread badge from the API (falls back to the config default until it loads).
  const { data: unread } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api.get<{ count: number }>("/api/Notifications/unread-count"),
    enabled: !!token,
    refetchInterval: 60_000,
  });
  const count = unread?.count ?? config.notificationCount ?? 0;

  const wrongRole = !!config.requireRole && !!user?.role && user.role !== config.requireRole;

  // Role-based routing guard: run once auth has hydrated.
  useEffect(() => {
    if (loading) return;
    if (!token || !user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (wrongRole && user.role) {
      navigate({ to: (HOME_BY_ROLE[user.role] ?? "/login") as string, replace: true });
    }
  }, [loading, token, user, wrongRole, navigate]);

  // Hold rendering until we know the user is allowed here (prevents a flash of
  // the wrong portal before the redirect fires, and covers SSR where there's no token).
  if (loading || !token || !user || wrongRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayName = user.fullName?.trim() || config.user.name;
  const displayRole = (user.role && ROLE_LABELS[user.role]) || config.user.role;

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "15rem", "--sidebar-width-icon": "3.25rem" } as CSSProperties}
    >
      <div className="flex min-h-screen w-full bg-background">
        <ShellSidebar config={config} />
        <SidebarInset className="bg-transparent">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-card/80 px-4 backdrop-blur-md md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="hidden sm:block sm:w-60 md:w-80">
              <SearchInput placeholder={config.searchPlaceholder ?? "Search…"} />
            </div>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <Link
                to="/notifications"
                aria-label="Notifications"
                className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
              <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
              <button className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-muted">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br text-xs font-bold text-white ring-2 ring-white",
                    accent.avatar,
                  )}
                >
                  {initials(displayName)}
                </div>
                <div className="hidden flex-col items-start leading-tight md:flex">
                  <span className="text-sm font-semibold">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{displayRole}</span>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
              </button>
            </div>
          </header>
          <main className="app-canvas flex-1 overflow-x-hidden">
            <div className="w-full p-5 md:p-7 lg:p-8">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
