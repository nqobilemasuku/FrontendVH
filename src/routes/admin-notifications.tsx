import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import {
  Bell,
  Send,
  Megaphone,
  FileText,
  PiggyBank,
  Briefcase,
  Store,
  CalendarDays,
  Circle,
  Loader2,
  Check,
} from "lucide-react";
import { PageHeader, Panel, IconBadge, btn, type Tone } from "@/components/dashboard/ui";
import { ListSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-notifications")({
  head: () => ({ meta: [{ title: "Notifications & Announcements · Varsity Hub" }] }),
  component: AdminNotifications,
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
  bursary: { label: "Bursaries", icon: PiggyBank, tone: "emerald" },
  job: { label: "Jobs", icon: Briefcase, tone: "indigo" },
  marketplace: { label: "Marketplace", icon: Store, tone: "fuchsia" },
  event: { label: "Events", icon: CalendarDays, tone: "amber" },
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

const roles = [
  { value: "", label: "Everyone" },
  { value: "student", label: "Students" },
  { value: "counsellor", label: "Counsellors" },
  { value: "parent", label: "Parents" },
  { value: "university_admin", label: "University Admins" },
  { value: "super_admin", label: "Super Admins" },
];

const categories = ["system", "application", "bursary", "job", "marketplace", "event"];

const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25";

function AdminNotifications() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    category: "system",
    title: "",
    body: "",
    actionUrl: "",
    role: "",
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => api.get<NotificationDetail[]>("/api/Notifications?page=1&pageSize=100"),
  });
  const items = data ?? [];

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/api/Notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const broadcast = useMutation({
    mutationFn: () =>
      api.post("/api/admin/notifications/broadcast", {
        category: form.category,
        title: form.title,
        body: form.body || undefined,
        actionUrl: form.actionUrl || undefined,
        role: form.role || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      setForm((f) => ({ ...f, title: "", body: "", actionUrl: "" }));
    },
  });

  return (
    <SuperAdminShell>
      <PageHeader
        eyebrow="National Administration"
        title="Notifications & Announcements"
        subtitle="Send platform wide announcements and review the notification feed."
        icon={Bell}
        tone="fuchsia"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Feed */}
        <div className="lg:col-span-2">
          <Panel flush>
            {isLoading && <ListSkeleton />}
            {isError && (
              <div className="px-5 py-16 text-center text-sm text-rose-600">
                Couldn't load notifications.
              </div>
            )}
            {!isLoading && !isError && (
              <ul className="divide-y divide-border/50">
                {items.map((n) => {
                  const m = meta[n.category] ?? fallbackMeta;
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        "flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/30",
                        !n.isRead && "bg-primary/3",
                      )}
                    >
                      <IconBadge icon={m.icon} tone={m.tone} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={cn(
                              "truncate text-sm",
                              !n.isRead ? "font-semibold" : "font-medium text-foreground/80",
                            )}
                          >
                            {n.title}
                          </h4>
                          {!n.isRead && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                        <span className="mt-1 block text-xs text-muted-foreground/70">
                          {timeAgo(n.createdAt)}
                        </span>
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
                {items.length === 0 && (
                  <li className="px-5 py-16 text-center text-sm text-muted-foreground">
                    No notifications yet.
                  </li>
                )}
              </ul>
            )}
          </Panel>
        </div>

        {/* Broadcast */}
        <div>
          <Panel
            title="Broadcast"
            description="Send a notification to users"
            icon={Megaphone}
            tone="fuchsia"
            className="lg:sticky lg:top-6"
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <select
                  className={inputCls}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {meta[c]?.label ?? c.replace(/\b\w/g, (x) => x.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Title
                </label>
                <input
                  className={inputCls}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Announcement title…"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Message
                </label>
                <textarea
                  rows={5}
                  className={cn(inputCls, "resize-none")}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Write your announcement…"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Action URL (optional)
                </label>
                <input
                  className={inputCls}
                  value={form.actionUrl}
                  onChange={(e) => setForm((f) => ({ ...f, actionUrl: e.target.value }))}
                  placeholder="/some-page"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Target Audience
                </label>
                <select
                  className={inputCls}
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {broadcast.isSuccess && (
                <p className="inline-flex items-center gap-1 text-sm text-emerald-600">
                  <Check className="h-4 w-4" /> Broadcast sent.
                </p>
              )}
              {broadcast.isError && (
                <p className="text-sm text-rose-600">Couldn't send broadcast.</p>
              )}
              <button
                className={cn(btn.primary, "w-full")}
                disabled={broadcast.isPending || !form.title}
                onClick={() => broadcast.mutate()}
              >
                {broadcast.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Broadcast
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </SuperAdminShell>
  );
}
