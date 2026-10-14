/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StudentShell } from "@/components/StudentShell";
import {
  Compass,
  ArrowRight,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Building2,
  Briefcase,
  X,
  Loader2,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  StatusPill,
  IconBadge,
  toneClasses,
  btn,
  type Tone,
} from "@/components/dashboard/ui";
import { CardGridSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/career-guidance")({
  head: () => ({ meta: [{ title: "Career Guidance · Varsity Hub" }] }),
  component: CareerGuidance,
});

type EligibleProgrammeDto = {
  id: string;
  name: string;
  minAps: number | null;
  university: string;
  shortCode: string;
};

// The careers endpoint isn't finalised — every field is treated as optional.
type Career = {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  summary?: string | null;
  field?: string | null;
  category?: string | null;
  programmes?: unknown;
  skills?: unknown;
};

const careerTitle = (c: Career) => c.title ?? c.name ?? "Untitled career";
const careerDesc = (c: Career) => c.description ?? c.summary ?? null;
// Programmes/skills may arrive as string[] or objects — normalise to labels.
function toLabels(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const label = o.name ?? o.title ?? o.label;
        return typeof label === "string" ? label : null;
      }
      return null;
    })
    .filter((x): x is string => Boolean(x));
}

const tabs = ["Programmes you qualify for", "Explore Careers", "Assessment"];

const categories: { label: string; tone: Tone }[] = [
  { label: "Engineering", tone: "amber" },
  { label: "Health Sciences", tone: "rose" },
  { label: "Information Technology", tone: "primary" },
  { label: "Business & Finance", tone: "emerald" },
  { label: "Education", tone: "blue" },
  { label: "Creative Arts", tone: "fuchsia" },
];

const cardTones: Tone[] = ["primary", "violet", "blue", "emerald", "indigo", "teal"];

function CareerGuidance() {
  const [tab, setTab] = useState(0);
  const [careerId, setCareerId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["me", "eligible-programmes"],
    queryFn: () => api.get<EligibleProgrammeDto[]>("/api/me/eligible-programmes"),
  });

  // /api/careers may 404 until deployed — handled with a graceful empty state.
  const careers = useQuery({
    queryKey: ["careers"],
    queryFn: () => api.get<Career[]>("/api/careers"),
    enabled: tab === 1,
    retry: false,
  });

  const programmes = data ?? [];
  const careerList = careers.data ?? [];

  return (
    <StudentShell>
      <PageHeader
        icon={Compass}
        eyebrow="Explore"
        title="Career Guidance"
        subtitle="Explore programmes you qualify for and career paths that match your strengths."
      />

      {/* Tabs (presentational) */}
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              i === tab
                ? "bg-card text-foreground shadow-(--shadow-xs)"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 1 && (
        <div className="mt-6">
          {careers.isLoading && (
            <CardGridSkeleton media={false} columns="sm:grid-cols-2 xl:grid-cols-3" />
          )}

          {/* On error (e.g. endpoint not yet deployed) show a friendly "coming soon" state, not a red error box. */}
          {!careers.isLoading && (careers.isError || careerList.length === 0) && (
            <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
              <IconBadge icon={Briefcase} tone="violet" size="lg" className="mx-auto" />
              <h3 className="mt-4 font-semibold">Career explorer coming soon</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                We're building a rich library of careers with the skills, salaries and study paths behind each one. Check back shortly.
              </p>
            </div>
          )}

          {!careers.isLoading && !careers.isError && careerList.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {careerList.map((c, i) => {
                const tone = cardTones[i % cardTones.length];
                const skills = toLabels(c.skills);
                const desc = careerDesc(c);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCareerId(c.id)}
                    className="group flex flex-col rounded-2xl border border-border/70 bg-card p-5 text-left shadow-(--shadow-card) transition-all duration-200 hover:-translate-y-1 hover:shadow-(--shadow-md)"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <IconBadge icon={Briefcase} tone={tone} size="lg" />
                      {(c.field ?? c.category) && (
                        <StatusPill tone={tone} dot={false}>{c.field ?? c.category}</StatusPill>
                      )}
                    </div>
                    <h4 className="mt-3 font-semibold leading-tight tracking-tight">{careerTitle(c)}</h4>
                    {desc && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{desc}</p>}
                    {skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {skills.slice(0, 4).map((s) => (
                          <span key={s} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-primary">
                      View career <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 2 && (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-12 text-center">
          <IconBadge icon={Sparkles} tone="primary" size="lg" className="mx-auto" />
          <h3 className="mt-4 font-semibold">Career assessment coming soon</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            A guided assessment to match your interests and strengths to careers is on the way.
          </p>
        </div>
      )}

      <div className={cn("mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]", tab !== 0 && "hidden")}>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Based on your APS, you qualify for these programmes:
          </div>

          {isLoading && (
            <CardGridSkeleton
              media={false}
              columns="sm:grid-cols-2 xl:grid-cols-3"
              className="mt-6"
            />
          )}
          {isError && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
              Couldn't load eligible programmes.
            </div>
          )}

          {!isLoading && !isError && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {programmes.map((p, i) => {
                const tone = cardTones[i % cardTones.length];
                return (
                  <div
                    key={p.id}
                    className="group flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-(--shadow-card) transition-all duration-200 hover:-translate-y-1 hover:shadow-(--shadow-md)"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <IconBadge icon={GraduationCap} tone={tone} size="lg" />
                      <StatusPill tone="emerald" dot={false}>Qualifies</StatusPill>
                    </div>
                    <h4 className="mt-3 font-semibold leading-tight tracking-tight">{p.name}</h4>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" /> {p.university}
                    </p>
                    <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="text-xs text-muted-foreground">
                        {p.minAps != null ? `Min APS ${p.minAps}` : "APS not specified"}
                      </span>
                      <StatusPill tone={tone} dot={false}>{p.shortCode}</StatusPill>
                    </div>
                  </div>
                );
              })}
              {programmes.length === 0 && (
                <div className="sm:col-span-2 xl:col-span-3 rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
                  No eligible programmes yet. Capture your Grade 12 results to see matches.
                </div>
              )}
            </div>
          )}

          {!isLoading && !isError && programmes.length === 0 && (
            <Link to={"/academic-results" as string} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Add academic results <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <Panel icon={Compass} tone="violet" title="Explore Careers" description="Browse by field">
          <ul className="space-y-1.5">
            {categories.map((c) => (
              <li key={c.label}>
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium transition-colors hover:border-border/60 hover:bg-muted/40"
                >
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", toneClasses(c.tone).bar)} />
                  <span className="flex-1">{c.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View all careers <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </Panel>
      </div>

      {careerId && (
        <CareerDetailModal
          id={careerId}
          fallback={careerList.find((c) => c.id === careerId) ?? null}
          onClose={() => setCareerId(null)}
        />
      )}
    </StudentShell>
  );
}

function CareerDetailModal({
  id,
  fallback,
  onClose,
}: {
  id: string;
  fallback: Career | null;
  onClose: () => void;
}) {
  // GET /api/careers/{id} may 404 until deployed — fall back to the list item.
  const { data, isLoading } = useQuery({
    queryKey: ["careers", id],
    queryFn: () => api.get<Career>(`/api/careers/${id}`),
    retry: false,
  });
  const c = data ?? fallback;
  if (!c) return null;

  const desc = careerDesc(c);
  const programmes = toLabels(c.programmes);
  const skills = toLabels(c.skills);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border/60 bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <IconBadge icon={Briefcase} tone="violet" size="lg" />
            <div>
              <h2 className="text-lg font-bold leading-tight">{careerTitle(c)}</h2>
              {(c.field ?? c.category) && (
                <p className="mt-0.5 text-xs text-muted-foreground">{c.field ?? c.category}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 p-6">
          {isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading details…</div>}

          {desc && <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{desc}</p>}

          {skills.length > 0 && (
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Key skills</div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{s}</span>
                ))}
              </div>
            </div>
          )}

          {programmes.length > 0 && (
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Related programmes</div>
              <ul className="space-y-1.5">
                {programmes.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-primary" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!desc && skills.length === 0 && programmes.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">No further details available for this career yet.</p>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end border-t border-border/60 bg-card px-6 py-4">
          <button className={btn.outline} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
