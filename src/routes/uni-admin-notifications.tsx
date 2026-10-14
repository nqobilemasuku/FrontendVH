import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UniversityAdminShell } from "@/components/UniversityAdminShell";
import {
  Bell,
  CheckCheck,
  Inbox,
  FileText,
  CheckCircle2,
  XCircle,
  BarChart3,
  Settings,
  Circle,
} from "lucide-react";
import type { ComponentType } from "react";
import { PageHeader, Panel, IconBadge, btn, type Tone } from "@/components/dashboard/ui";
import { ListSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/uni-admin-notifications")({
  head: () => ({ meta: [{ title: "Notifications · Varsity Hub" }] }),
  component: UniAdminNotifications,
});

type NotificationDetail = {
  id: string;
  category: string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

const meta: Record<string, { label: string; icon: ComponentType<{ className?: string }>; tone: Tone }> = {
  application: { label: "Applications", icon: Inbox, tone: "blue" },
  document: { label: "Documents", icon: FileText, tone: "indigo" },
  approved: { label: "Approvals", icon: CheckCircle2, tone: "emerald" },
  rejected: { label: "Rejections", icon: XCircle, tone: "rose" },
  report: { label: "Reports", icon: BarChart3, tone: "violet" },
  system: { label: "System", icon: Settings, tone: "slate" },
};
const fallbackMeta = { label: "Updates", icon: Bell, tone: "slate" as Tone };

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

function UniAdminNotifications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["uni-admin", "notifications"],
    queryFn: () => api.get<NotificationDetail[]>("/api/Notifications?page=1&pageSize=100"),
  });
  const items = data ?? [];

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/api/Notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["uni-admin", "notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      await Promise.all(items.filter((i) => !i.isRead).map((i) => api.patch(`/api/Notifications/${i.id}/read`)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["uni-admin", "notifications"] }),
  });

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);
  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );
  const unreadCount = items.filter((i) => !i.isRead).length;

  const tabs: { id: string; label: string }[] = [
    { id: "all", label: "All" },
    ...categories.map((c) => ({ id: c, label: meta[c]?.label ?? c })),
  ];

  return (
    <UniversityAdminShell>
      <PageHeader
        eyebrow="Insights"
        title="Notifications"
        subtitle={`You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`}
        icon={Bell}
        tone="blue"
        actions={
          <button
            onClick={() => markAll.mutate()}
            className={btn.outline}
            disabled={markAll.isPending || unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        }
      />

      {/* Filter pills */}
      <div className="mb-6 inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
        {tabs.map((t) => {
          const count =
            t.id === "all"
              ? unreadCount
              : items.filter((i) => i.category === t.id && !i.isRead).length;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                filter === t.id ? "bg-card text-foreground shadow-(--shadow-xs)" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 text-[10px] font-semibold text-blue-700">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Panel flush>
        {isLoading && <ListSkeleton />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">Couldn't load notifications.</div>
        )}
        {!isLoading && !isError && (
          <ul className="divide-y divide-border/50">
            {filtered.map((n) => {
              const m = meta[n.category] ?? fallbackMeta;
              return (
                <li
                  key={n.id}
                  className={cn(
                    "flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/30",
                    !n.isRead && "bg-blue-50/50",
                  )}
                >
                  <IconBadge icon={m.icon} tone={m.tone} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={cn("truncate text-sm", !n.isRead ? "font-semibold" : "font-medium text-foreground/80")}>
                        {n.title}
                      </h4>
                      {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
                    </div>
                    {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                    <span className="mt-1 block text-xs text-muted-foreground/70">{timeAgo(n.createdAt)}</span>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => markRead.mutate(n.id)}
                      title="Mark as read"
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Circle className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-5 py-16 text-center text-sm text-muted-foreground">No notifications here.</li>
            )}
          </ul>
        )}
      </Panel>
    </UniversityAdminShell>
  );
}
