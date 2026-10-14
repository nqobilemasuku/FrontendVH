/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays, MapPin, Clock, Users, Search, Ticket, Briefcase,
  Presentation, Network, CheckCircle2,
} from "lucide-react";
import { StudentShell } from "@/components/StudentShell";
import { CardGridSkeleton } from "@/components/dashboard/skeletons";
import { PageHeader, StatCard, StatusPill, toneClasses, btn, type Tone } from "@/components/dashboard/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Events Hub · Varsity Hub" }] }),
  component: Events,
});

type Ev = {
  id: string;
  title: string;
  type: string;
  host: string | null;
  location: string | null;
  isOnline: boolean;
  capacity: number | null;
  startsAt: string;
  endsAt: string | null;
  description: string | null;
  isRegistered: boolean;
};

const typeMeta: Record<string, { label: string; icon: typeof Briefcase; tone: Tone }> = {
  career_fair: { label: "Career Fair", icon: Briefcase, tone: "primary" },
  workshop: { label: "Workshop", icon: Presentation, tone: "indigo" },
  networking: { label: "Networking", icon: Network, tone: "fuchsia" },
  open_day: { label: "Open Day", icon: CalendarDays, tone: "emerald" },
  seminar: { label: "Seminar", icon: Presentation, tone: "amber" },
};
function tMeta(t: string) { return typeMeta[t] ?? { label: t, icon: CalendarDays, tone: "slate" as Tone }; }

const tabs = [
  { id: "all", label: "All" },
  { id: "career_fair", label: "Career Fair" },
  { id: "workshop", label: "Workshop" },
  { id: "networking", label: "Networking" },
];

function Events() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", tab],
    queryFn: () => {
      const qs = new URLSearchParams({ upcomingOnly: "true" });
      if (tab !== "all") qs.set("type", tab);
      return api.get<Ev[]>(`/api/Events?${qs.toString()}`);
    },
  });

  const register = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on ? api.post(`/api/Events/${id}/register`) : api.del(`/api/Events/${id}/register`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const events = (data ?? []).filter((e) => query === "" || e.title.toLowerCase().includes(query.toLowerCase()));
  const registeredCount = (data ?? []).filter((e) => e.isRegistered).length;

  return (
    <StudentShell>
      <PageHeader icon={CalendarDays} eyebrow="Opportunities" title="Events Hub"
        subtitle="Discover career fairs, workshops and networking events to build your skills and connections." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarDays} tone="primary" label="Upcoming events" value={data?.length ?? "—"} />
        <StatCard icon={Briefcase} tone="emerald" label="Career fairs" value={(data ?? []).filter((e) => e.type === "career_fair").length} />
        <StatCard icon={Ticket} tone="amber" label="You're registered" value={registeredCount} />
        <StatCard icon={Users} tone="indigo" label="Event types" value={new Set((data ?? []).map((e) => e.type)).size} />
      </div>

      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events…"
          className="w-full rounded-lg border border-border/70 bg-card py-2.5 pl-9 pr-3 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25" />
      </div>

      <div className="mb-5 inline-flex flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", tab === t.id ? "bg-card text-foreground shadow-(--shadow-xs)" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <CardGridSkeleton columns="grid-cols-1" />}
      {isError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">Couldn't load events.</div>}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {events.map((e) => {
            const m = tMeta(e.type);
            const start = new Date(e.startsAt);
            const day = start.toLocaleDateString("en-ZA", { day: "2-digit" });
            const month = start.toLocaleDateString("en-ZA", { month: "short" }).toUpperCase();
            const time = start.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={e.id} className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-(--shadow-card) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-md) sm:flex-row sm:items-center">
                <div className={cn("flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl", toneClasses(m.tone).soft)}>
                  <span className="text-xl font-extrabold leading-none text-foreground">{day}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{month}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{e.title}</h3>
                    <StatusPill tone={m.tone} dot={false}>{m.label}</StatusPill>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {time}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {e.isOnline ? "Online" : e.location ?? "TBC"}</span>
                    {e.capacity != null && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {e.capacity} seats</span>}
                  </div>
                  {e.host && <p className="mt-1 text-xs text-muted-foreground">Hosted by {e.host}</p>}
                </div>
                <div className="shrink-0">
                  {e.isRegistered ? (
                    <button onClick={() => register.mutate({ id: e.id, on: false })} disabled={register.isPending} className={cn(btn.soft, "gap-1.5")}>
                      <CheckCircle2 className="h-4 w-4" /> Registered
                    </button>
                  ) : (
                    <button onClick={() => register.mutate({ id: e.id, on: true })} disabled={register.isPending} className={btn.primary}>
                      <Ticket className="h-4 w-4" /> Register
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {events.length === 0 && <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">No events found.</div>}
        </div>
      )}
    </StudentShell>
  );
}
