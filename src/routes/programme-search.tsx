/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Heart,
  BookOpen,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  GraduationCap,
  Banknote,
  CalendarDays,
} from "lucide-react";
import { StudentShell } from "@/components/StudentShell";
import { CardGridSkeleton } from "@/components/dashboard/skeletons";
import {
  PageHeader,
  Panel,
  StatusPill,
  btn,
  type Tone,
} from "@/components/dashboard/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/programme-search")({
  head: () => ({ meta: [{ title: "Programme Search · Varsity Hub" }] }),
  component: ProgrammeSearch,
});

type Programme = {
  id: string;
  name: string;
  qualification: string;
  minAps: number;
  university: string;
  shortCode: string;
  faculty: string | null;
  tuitionPerYear: number | null;
  durationYears: number | null;
  applicationDeadline: string | null;
};

type Uni = { id: string; name: string; shortCode: string };

const qualificationLabels: Record<string, string> = {
  higher_certificate: "Higher Certificate",
  diploma: "Diploma",
  bachelor: "Bachelor's Degree",
  honours: "Honours",
  masters: "Master's",
  doctorate: "Doctorate",
};
function qualLabel(q: string) {
  return qualificationLabels[q] ?? q;
}

function ProgrammeSearch() {
  const [query, setQuery] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [faculty, setFaculty] = useState("");
  const [aps, setAps] = useState("");

  // Universities to populate the filter dropdown.
  const { data: universities } = useQuery({
    queryKey: ["universities", "for-filter"],
    queryFn: () => api.get<Uni[]>("/api/Universities", { auth: false }),
  });

  // Full programme list — used to build the faculty dropdown options.
  const { data: allProgrammes } = useQuery({
    queryKey: ["programmes", "all"],
    queryFn: () => api.get<Programme[]>("/api/Programmes"),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["programmes", universityId, faculty, aps],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (universityId) qs.set("universityId", universityId);
      if (faculty) qs.set("faculty", faculty);
      if (aps) qs.set("minAps", aps);
      return api.get<Programme[]>(`/api/Programmes?${qs.toString()}`);
    },
  });

  const facultyOptions = Array.from(
    new Set((allProgrammes ?? []).map((p) => p.faculty).filter((f): f is string => !!f)),
  ).sort();

  const programmes = (data ?? []).filter(
    (p) =>
      query === "" ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.university.toLowerCase().includes(query.toLowerCase()),
  );

  const studentAps = aps ? Number(aps) : null;
  const eligibleCount =
    studentAps != null ? programmes.filter((p) => studentAps >= p.minAps).length : 0;

  return (
    <StudentShell>
      <PageHeader
        icon={BookOpen}
        eyebrow="Explore"
        title="Programme Search"
        subtitle="Discover programmes that match your interests and academic results."
        actions={
          studentAps != null ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4" />
              {eligibleCount} of {programmes.length} match your APS {studentAps}
            </span>
          ) : undefined
        }
      />

      {/* Filters */}
      <Panel>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a programme or university…"
            className="w-full rounded-lg border border-border/70 bg-card py-2.5 pl-10 pr-4 text-sm shadow-(--shadow-xs) transition-shadow placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex min-w-40 flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">University</span>
            <select
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              className="rounded-lg border border-border/70 bg-card py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              <option value="">All</option>
              {(universities ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-40 flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Faculty</span>
            <select
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="rounded-lg border border-border/70 bg-card py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              <option value="">All</option>
              {facultyOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-36 flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Your APS</span>
            <input
              type="number"
              value={aps}
              onChange={(e) => setAps(e.target.value)}
              placeholder="e.g. 35"
              className="rounded-lg border border-border/70 bg-card py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </label>
        </div>
      </Panel>

      {isLoading && <CardGridSkeleton media={false} className="mt-6" />}
      {isError && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load programmes right now. Please try again shortly.
        </div>
      )}

      {/* Results */}
      {!isLoading && !isError && (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {programmes.map((p) => {
              const known = studentAps != null;
              const eligible = known && studentAps >= p.minAps;
              const tone: Tone = !known ? "slate" : eligible ? "emerald" : "rose";
              return (
                <div
                  key={p.id}
                  className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-(--shadow-card) transition-all duration-200 hover:-translate-y-1 hover:shadow-(--shadow-md)"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-brand-cyan text-sm font-bold text-white shadow-(--shadow-soft)">
                        {p.shortCode}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">{p.university}</p>
                        {known && (
                          <StatusPill tone={tone} className="mt-1">
                            {eligible ? "Eligible" : "APS too low"}
                          </StatusPill>
                        )}
                      </div>
                    </div>
                    <button
                      aria-label="Save programme"
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Heart className="h-5 w-5" />
                    </button>
                  </div>

                  <h3 className="mt-4 text-base font-bold leading-snug tracking-tight">{p.name}</h3>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5" /> {qualLabel(p.qualification)}
                    </span>
                    {p.faculty && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" /> {p.faculty}
                      </span>
                    )}
                    {p.durationYears != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" /> {p.durationYears} Year{p.durationYears === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  {(p.tuitionPerYear != null || p.applicationDeadline) && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {p.tuitionPerYear != null && (
                        <span className="inline-flex items-center gap-1">
                          <Banknote className="h-3.5 w-3.5 text-emerald-600" /> R {p.tuitionPerYear.toLocaleString("en-ZA")}/yr
                        </span>
                      )}
                      {p.applicationDeadline && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" /> closes{" "}
                          {new Date(p.applicationDeadline).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" })}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        APS Required
                      </p>
                      <p className="text-lg font-bold tabular-nums">{p.minAps}</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-right">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Your APS
                      </p>
                      <p
                        className={cn(
                          "text-lg font-bold tabular-nums",
                          !known ? "text-muted-foreground" : eligible ? "text-emerald-600" : "text-rose-600",
                        )}
                      >
                        {known ? studentAps : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-2 pt-4">
                    <button className={cn(btn.outline, "flex-1")}>View Details</button>
                    <button className={cn(btn.primary, "flex-1")} disabled={known && !eligible}>
                      Apply <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {programmes.length === 0 && (
            <div className="mt-6 rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
              No programmes match your search.
            </div>
          )}
        </>
      )}
    </StudentShell>
  );
}
