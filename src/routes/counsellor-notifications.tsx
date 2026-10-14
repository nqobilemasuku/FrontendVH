import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CounsellorShell } from "@/components/CounsellorShell";
import {
  Bell,
  FileText,
  AlertTriangle,
  CalendarClock,
  UserPlus,
  BarChart3,
  CheckCheck,
  Circle,
} from "lucide-react";
import { PageHeader, IconBadge, StatusPill, btn, type Tone } from "@/components/dashboard/ui";
import { ListSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/counsellor-notifications")({
  head: () => ({ meta: [{ title: "Notifications · Varsity Hub" }] }),
  component: CounsellorNotifications,
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

const meta: Record<string, { label: string; icon: typeof Bell; tone: Tone }> = {
  application: { label: "Applications", icon: FileText, tone: "primary" },
  missing_docs: { label: "Missing Docs", icon: AlertTriangle, tone: "rose" },
  deadline: { label: "Deadlines", icon: CalendarClock, tone: "amber" },
  learner: { label: "Learners", icon: UserPlus, tone: "indigo" },
  report: { label: "Reports", icon: BarChart3, tone: "violet" },
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

function CounsellorNotifications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["counsellor-notifications"],
    queryFn: () => api.get<NotificationDetail[]>("/api/Notifications?page=1&pageSize=100"),
  });
  const items = useMemo(() => data ?? [], [data]);

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/api/Notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["counsellor-notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      await Promise.all(
        items.filter((i) => !i.isRead).map((i) => api.patch(`/api/Notifications/${i.id}/read`)),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["counsellor-notifications"] }),
  });

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);
  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );
  const unreadCount = items.filter((i) => !i.isRead).length;

  const tabs: { id: string; label: string }[] = [
    { id: "all", label: "All" },
    ...categories.map((c) => ({
      id: c,
      label: meta[c]?.label ?? c.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase()),
    })),
  ];

  return (
    <CounsellorShell>
      <PageHeader
        eyebrow="Counsellor workspace"
        title="Notifications"
        subtitle={`You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`}
        icon={Bell}
        tone="indigo"
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

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {tabs.map((t) => {
          const count =
            t.id === "all"
              ? unreadCount
              : items.filter((i) => i.category === t.id && !i.isRead).length;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={
                filter === t.id
                  ? "inline-flex items-center gap-1.5 rounded-full border border-indigo-500 bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600"
                  : "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60"
              }
            >
              {t.label}
              {count > 0 && (
                <span className="rounded-full bg-rose-100 px-1.5 text-[10px] font-semibold text-rose-600">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading && <ListSkeleton />}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load notifications.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-2.5">
          {filtered.map((n) => {
            const m = meta[n.category] ?? fallbackMeta;
            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 rounded-2xl border px-5 py-4 transition-colors",
                  n.isRead
                    ? "border-border/70 bg-card shadow-(--shadow-card) hover:bg-muted/30"
                    : "border-indigo-200 bg-indigo-50",
                )}
              >
                <IconBadge icon={m.icon} tone={m.tone} />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      n.isRead ? "text-foreground" : "font-semibold text-foreground",
                    )}
                  >
                    {n.title}
                  </p>
                  {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <StatusPill tone="slate" dot={false}>
                      {m.label}
                    </StatusPill>
                  </div>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    title="Mark as read"
                    className="mt-1 shrink-0 rounded-md p-1.5 text-indigo-500 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Circle className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
              No notifications here.
            </div>
          )}
        </div>
      )}
    </CounsellorShell>
  );
}
