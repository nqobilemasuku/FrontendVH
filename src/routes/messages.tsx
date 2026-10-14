/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare, Plus, Loader2 } from "lucide-react";
import { StudentShell } from "@/components/StudentShell";
import { ListSkeleton } from "@/components/dashboard/skeletons";
import { PageHeader, btn } from "@/components/dashboard/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages · Varsity Hub" }] }),
  component: Messages,
});

type Conversation = {
  id: string;
  subject: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

type Message = {
  id: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

/* Relative-time helper (matches the pattern in src/routes/notifications.tsx). */
function timeAgo(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

function initials(subject: string) {
  return (
    subject
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}

function Messages() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const myId = user?.id;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  /* ----------------------------- Queries ----------------------------- */

  const conversationsQ = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get<Conversation[]>("/api/conversations"),
  });
  const conversations = conversationsQ.data ?? [];
  const active = conversations.find((c) => c.id === activeId) ?? null;

  const messagesQ = useQuery({
    queryKey: ["conversation", activeId, "messages"],
    queryFn: () => api.get<Message[]>(`/api/conversations/${activeId}/messages`),
    enabled: !!activeId,
  });
  const messages = messagesQ.data ?? [];

  /* --------------------------- Mutations ----------------------------- */

  const sendMessage = useMutation({
    mutationFn: (body: string) =>
      api.post<Message | void>(`/api/conversations/${activeId}/messages`, { body }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["conversation", activeId, "messages"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/api/conversations/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });

  /* --------------------------- Effects ------------------------------- */

  // When a conversation is opened, mark it read once (only if it has unread).
  const readFiredFor = useRef<string | null>(null);
  useEffect(() => {
    if (!activeId) return;
    if (readFiredFor.current === activeId) return;
    const conv = conversations.find((c) => c.id === activeId);
    if (conv && conv.unreadCount > 0) {
      readFiredFor.current = activeId;
      markRead.mutate(activeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, conversations]);

  // Auto-scroll the thread to the latest message.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, activeId]);

  const totalUnread = conversations.reduce((a, c) => a + c.unreadCount, 0);

  function handleSend() {
    const text = draft.trim();
    if (!text || !activeId || sendMessage.isPending) return;
    sendMessage.mutate(text);
  }

  return (
    <StudentShell>
      <PageHeader
        icon={MessageSquare}
        eyebrow="Applications"
        title="Messages"
        subtitle="Chat with universities and support."
        actions={
          <>
            {totalUnread > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {totalUnread} unread
              </span>
            )}
            <button type="button" className={btn.outline}>
              <Plus className="h-4 w-4" /> New message
            </button>
          </>
        }
      />

      <div className="grid h-[calc(100vh-15rem)] grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
        {/* Left pane — conversation list */}
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-(--shadow-card)">
          <header className="border-b border-border/60 px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
          </header>

          {conversationsQ.isLoading ? (
            <div className="p-3">
              <ListSkeleton rows={5} className="border-0 shadow-none" />
            </div>
          ) : conversationsQ.isError ? (
            <div className="px-5 py-16 text-center text-sm text-rose-600">
              Couldn't load conversations.
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">No conversations yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start a new message to get in touch.
              </p>
            </div>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-border/50 overflow-y-auto">
              {conversations.map((c) => {
                const isActive = activeId === c.id;
                const isUnread = c.unreadCount > 0;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(c.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors",
                        isActive ? "bg-primary/5" : "hover:bg-muted/40",
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-brand-cyan text-xs font-bold text-white">
                        {initials(c.subject)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "truncate text-sm",
                              isUnread ? "font-bold" : "font-semibold",
                            )}
                          >
                            {c.subject}
                          </p>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {timeAgo(c.lastMessageAt)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 truncate text-xs",
                            isUnread ? "font-medium text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {c.lastMessage ?? "No messages yet"}
                        </p>
                      </div>
                      {isUnread && (
                        <span className="mt-1 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Right pane — thread */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-(--shadow-card)">
          {!activeId ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Select a conversation</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose a conversation from the list to view messages.
              </p>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-border/60 px-5 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-primary to-brand-cyan text-xs font-bold text-white">
                  {initials(active?.subject ?? "")}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{active?.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(active?.lastMessageAt ?? null) || "No messages yet"}
                  </p>
                </div>
              </header>

              <div
                ref={threadRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/20 px-5 py-4"
              >
                {messagesQ.isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messagesQ.isError ? (
                  <div className="py-16 text-center text-sm text-rose-600">
                    Couldn't load messages.
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    No messages yet. Say hello 👋
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = !!myId && m.senderId === myId;
                    return (
                      <div
                        key={m.id}
                        className={cn("flex", mine ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-(--shadow-xs)",
                            mine
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-bl-md border border-border/70 bg-card",
                          )}
                        >
                          <p className="whitespace-pre-wrap wrap-break-word">{m.body}</p>
                          <p
                            className={cn(
                              "mt-1 text-[10px]",
                              mine ? "text-primary-foreground/70" : "text-muted-foreground",
                            )}
                          >
                            {timeAgo(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <footer className="flex items-end gap-2 border-t border-border/60 p-3">
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message…"
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!draft.trim() || sendMessage.isPending}
                  className={cn(btn.primary, "shrink-0 disabled:opacity-50")}
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </button>
              </footer>
            </>
          )}
        </section>
      </div>
    </StudentShell>
  );
}
