/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PiggyBank, Search, Bookmark, BookmarkCheck, GraduationCap, Building2,
  CheckCircle2, ArrowRight, Wallet, Clock, Check, Loader2, X, ExternalLink,
} from "lucide-react";
import { StudentShell } from "@/components/StudentShell";
import { CardGridSkeleton, ListSkeleton } from "@/components/dashboard/skeletons";
import { PageHeader, StatCard, StatusPill, ProgressBar, btn, type Tone } from "@/components/dashboard/ui";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bursaries")({
  head: () => ({ meta: [{ title: "Bursary Hub · Varsity Hub" }] }),
  component: Bursaries,
});

type Bursary = {
  id: string;
  name: string;
  provider: string;
  field: string;
  amountText: string | null;
  covers: string[];
  minAps: number | null;
  description: string | null;
  closesOn: string | null;
  applyUrl: string | null;
};
type BursaryApplication = {
  id: string;
  bursaryId: string;
  name: string;
  provider: string;
  status: string;
  submittedAt: string;
};

const fieldLabels: Record<string, string> = {
  engineering: "Engineering", it_science: "IT & Science", commerce: "Commerce",
  health: "Health", education: "Education", law: "Law", arts: "Arts", other: "Other",
};
const fieldTabs = [
  { id: "all", label: "All" },
  { id: "engineering", label: "Engineering" },
  { id: "it_science", label: "IT & Science" },
  { id: "commerce", label: "Commerce" },
  { id: "health", label: "Health" },
];
const views = [
  { id: "browse", label: "Browse" },
  { id: "applications", label: "Applications" },
  { id: "bookmarked", label: "Bookmarked" },
] as const;
type View = (typeof views)[number]["id"];

const appStatusLabels: Record<string, string> = {
  draft: "Draft", submitted: "Submitted", under_review: "Under review",
  approved: "Approved", rejected: "Rejected",
};
function appStatusTone(s: string): Tone {
  switch (s) {
    case "approved": return "emerald";
    case "under_review": return "amber";
    case "rejected": return "rose";
    default: return "primary"; // submitted / draft
  }
}

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}
function urgencyTone(d: number | null): Tone {
  if (d == null) return "slate";
  if (d <= 5) return "rose";
  if (d <= 21) return "amber";
  return "emerald";
}

function Bursaries() {
  const qc = useQueryClient();
  const [view, setView] = useState<View>("browse");
  const [field, setField] = useState("all");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  // Optimistically-applied ids (also set when the API returns 409 = already applied).
  const [appliedLocal, setAppliedLocal] = useState<string[]>([]);
  // Bursary whose Details modal is open (fallback data for the detail fetch).
  const [detail, setDetail] = useState<Bursary | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bursaries", field],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (field !== "all") qs.set("field", field);
      return api.get<Bursary[]>(`/api/Bursaries?${qs.toString()}`);
    },
  });
  // Loaded eagerly so Browse/Bookmarked can show which bursaries are already applied to.
  const mine = useQuery({
    queryKey: ["bursaries", "mine"],
    queryFn: () => api.get<BursaryApplication[]>("/api/Bursaries/mine"),
  });
  const bookmarked = useQuery({
    queryKey: ["bursaries", "bookmarked"],
    queryFn: () => api.get<Bursary[]>("/api/Bursaries/bookmarked"),
    enabled: view === "bookmarked",
  });

  const bookmark = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on ? api.post(`/api/Bursaries/${id}/bookmark`) : api.del(`/api/Bursaries/${id}/bookmark`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bursaries", "bookmarked"] }),
  });
  const apply = useMutation({
    mutationFn: (id: string) => api.post(`/api/Bursaries/${id}/apply`),
    onSuccess: (_data, id) => {
      setAppliedLocal((p) => (p.includes(id) ? p : [...p, id]));
      qc.invalidateQueries({ queryKey: ["bursaries", "mine"] });
    },
    onError: (err, id) => {
      // 409 = the student already applied to this bursary — treat it as applied.
      if (err instanceof ApiError && err.status === 409) {
        setAppliedLocal((p) => (p.includes(id) ? p : [...p, id]));
        qc.invalidateQueries({ queryKey: ["bursaries", "mine"] });
      }
    },
  });

  const bursaries = (data ?? []).filter(
    (b) => query === "" || b.name.toLowerCase().includes(query.toLowerCase()) || b.provider.toLowerCase().includes(query.toLowerCase()),
  );
  const appliedIds = new Set([...(mine.data ?? []).map((a) => a.bursaryId), ...appliedLocal]);
  const isApplied = (id: string) => appliedIds.has(id);
  const isApplying = (id: string) => apply.isPending && apply.variables === id;

  function toggleSave(id: string) {
    const has = saved.includes(id);
    setSaved((p) => (has ? p.filter((x) => x !== id) : [...p, id]));
    bookmark.mutate({ id, on: !has });
  }

  function handleApply(b: Bursary) {
    // If the bursary has an external apply link, open it — but still record the
    // application via the API so it shows up under "Applications".
    if (b.applyUrl) window.open(b.applyUrl, "_blank", "noopener,noreferrer");
    apply.mutate(b.id);
  }

  function renderBursaryCard(b: Bursary) {
    const d = daysLeft(b.closesOn);
    return (
      <div key={b.id} className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-(--shadow-card) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-md)">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-400 text-xs font-bold text-white">
              {b.provider.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-tight">{b.name}</h3>
              <p className="text-xs text-muted-foreground"><Building2 className="mr-1 inline h-3 w-3" />{b.provider} · {fieldLabels[b.field] ?? b.field}</p>
            </div>
          </div>
          <button onClick={() => toggleSave(b.id)} aria-label="Bookmark bursary"
            className={cn("rounded-lg border p-2 transition-colors", saved.includes(b.id) ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
            {saved.includes(b.id) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>

        {b.amountText && (
          <div className="mt-4 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">{b.amountText}</span>
          </div>
        )}

        {b.covers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {b.covers.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"><CheckCircle2 className="h-3 w-3" /> {c}</span>
            ))}
          </div>
        )}

        {b.closesOn && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Closes {new Date(b.closesOn).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}</span>
              {d != null && <StatusPill tone={urgencyTone(d)} dot>{d} days left</StatusPill>}
            </div>
            {d != null && <div className="mt-2"><ProgressBar value={Math.max(6, 100 - (d / 70) * 100)} tone={urgencyTone(d)} /></div>}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-4">
          {isApplied(b.id) ? (
            <button disabled className={cn(btn.outline, "flex-1 cursor-default text-emerald-600")}>
              <Check className="h-4 w-4" /> Applied
            </button>
          ) : (
            <button onClick={() => handleApply(b)} disabled={isApplying(b.id)} className={cn(btn.primary, "flex-1")}>
              {isApplying(b.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Apply <ArrowRight className="h-4 w-4" /></>}
            </button>
          )}
          <button className={btn.outline} onClick={() => setDetail(b)}>Details</button>
        </div>
      </div>
    );
  }

  return (
    <StudentShell>
      <PageHeader icon={PiggyBank} eyebrow="Opportunities" title="Bursary Hub"
        subtitle="Search bursaries and scholarships matched to your qualification and financial needs."
        actions={<button className={btn.outline}><Wallet className="h-4 w-4" /> Funding calculator</button>} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={PiggyBank} tone="emerald" label="Available bursaries" value={data?.length ?? "—"} />
        <StatCard icon={Bookmark} tone="amber" label="Bookmarked" value={saved.length} />
        <StatCard icon={GraduationCap} tone="indigo" label="Fields" value={new Set((data ?? []).map((b) => b.field)).size} />
        <StatCard icon={CheckCircle2} tone="primary" label="Closing soon" value={(data ?? []).filter((b) => { const d = daysLeft(b.closesOn); return d != null && d <= 7; }).length} />
      </div>

      <div className="mb-5 inline-flex flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
        {views.map((v) => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", view === v.id ? "bg-card text-foreground shadow-(--shadow-xs)" : "text-muted-foreground hover:text-foreground")}>
            {v.label}
          </button>
        ))}
      </div>

      {view === "browse" && (
        <>
          <div className="mb-4 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bursaries or providers…"
              className="w-full rounded-lg border border-border/70 bg-card py-2.5 pl-9 pr-3 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25" />
          </div>

          <div className="mb-5 inline-flex flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
            {fieldTabs.map((f) => (
              <button key={f.id} onClick={() => setField(f.id)}
                className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", field === f.id ? "bg-card text-foreground shadow-(--shadow-xs)" : "text-muted-foreground hover:text-foreground")}>
                {f.label}
              </button>
            ))}
          </div>

          {isLoading && <CardGridSkeleton columns="md:grid-cols-2" />}
          {isError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">Couldn't load bursaries.</div>}

          {!isLoading && !isError && (
            <div className="grid gap-4 md:grid-cols-2">
              {bursaries.map(renderBursaryCard)}
              {bursaries.length === 0 && <div className="md:col-span-2 rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">No bursaries found.</div>}
            </div>
          )}
        </>
      )}

      {view === "applications" && (
        <>
          {mine.isLoading && <ListSkeleton rows={5} />}
          {mine.isError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">Couldn't load your applications.</div>}

          {!mine.isLoading && !mine.isError && (
            <div className="space-y-3">
              {(mine.data ?? []).map((a) => (
                <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-(--shadow-card) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-md)">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-400 text-xs font-bold text-white">
                    {a.provider.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold leading-tight">{a.name}</h3>
                      <StatusPill tone={appStatusTone(a.status)} dot={false}>{appStatusLabels[a.status] ?? a.status}</StatusPill>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {a.provider}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Submitted {new Date(a.submittedAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(mine.data ?? []).length === 0 && <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">You haven't applied to any bursaries yet.</div>}
            </div>
          )}
        </>
      )}

      {view === "bookmarked" && (
        <>
          {bookmarked.isLoading && <CardGridSkeleton columns="md:grid-cols-2" />}
          {bookmarked.isError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">Couldn't load bookmarked bursaries.</div>}

          {!bookmarked.isLoading && !bookmarked.isError && (
            <div className="grid gap-4 md:grid-cols-2">
              {(bookmarked.data ?? []).map(renderBursaryCard)}
              {(bookmarked.data ?? []).length === 0 && <div className="md:col-span-2 rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">You haven't bookmarked any bursaries yet.</div>}
            </div>
          )}
        </>
      )}

      {detail && (
        <BursaryDetailModal
          fallback={detail}
          onClose={() => setDetail(null)}
          onApply={handleApply}
          applied={isApplied(detail.id)}
        />
      )}
    </StudentShell>
  );
}

function BursaryDetailModal({
  fallback,
  onClose,
  onApply,
  applied,
}: {
  fallback: Bursary;
  onClose: () => void;
  onApply: (b: Bursary) => void;
  applied: boolean;
}) {
  // GET /api/Bursaries/{id} is live; fall back to the list item if it fails.
  const { data, isLoading } = useQuery({
    queryKey: ["bursary", fallback.id],
    queryFn: () => api.get<Bursary>(`/api/Bursaries/${fallback.id}`),
  });
  const b = data ?? fallback;
  const d = daysLeft(b.closesOn);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border/60 bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-400 text-xs font-bold text-white">
              {b.provider.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">{b.name}</h2>
              <p className="text-xs text-muted-foreground"><Building2 className="mr-1 inline h-3 w-3" />{b.provider} · {fieldLabels[b.field] ?? b.field}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 p-6">
          {isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading details…</div>}

          {b.amountText && (
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">{b.amountText}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs font-medium text-muted-foreground">Minimum APS</div>
              <div className="mt-0.5 font-semibold">{b.minAps != null ? b.minAps : "Not specified"}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Closes on</div>
              <div className="mt-0.5 font-semibold">
                {b.closesOn ? new Date(b.closesOn).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                {d != null && <StatusPill tone={urgencyTone(d)} dot className="ml-2">{d} days left</StatusPill>}
              </div>
            </div>
          </div>

          {b.covers.length > 0 && (
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Covers</div>
              <div className="flex flex-wrap gap-1.5">
                {b.covers.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"><CheckCircle2 className="h-3 w-3" /> {c}</span>
                ))}
              </div>
            </div>
          )}

          {b.description && (
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">About this bursary</div>
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{b.description}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-border/60 bg-card px-6 py-4">
          {b.applyUrl && (
            <a href={b.applyUrl} target="_blank" rel="noopener noreferrer" className={btn.outline}>
              Apply on provider site <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {applied ? (
            <button disabled className={cn(btn.outline, "cursor-default text-emerald-600")}>
              <Check className="h-4 w-4" /> Applied
            </button>
          ) : (
            <button className={btn.primary} onClick={() => { onApply(b); onClose(); }}>
              Apply <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
