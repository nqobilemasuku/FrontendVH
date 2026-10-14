/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase, MapPin, Building2, Clock, Bookmark, BookmarkCheck, Sparkles,
  UploadCloud, Search, ArrowRight, Banknote, GraduationCap, Check, Loader2, FileText, X,
} from "lucide-react";
import { StudentShell } from "@/components/StudentShell";
import { CardGridSkeleton, ListSkeleton } from "@/components/dashboard/skeletons";
import { PageHeader, StatCard, Panel, StatusPill, btn, type Tone } from "@/components/dashboard/ui";
import { api, ApiError } from "@/lib/api";
import { uploadDocument } from "@/lib/documents";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/job-hub")({
  head: () => ({ meta: [{ title: "Job Hub · Varsity Hub" }] }),
  component: JobHub,
});

type Job = {
  id: string;
  title: string;
  company: string;
  type: string;
  location: string | null;
  salaryText: string | null;
  description: string | null;
  tags: string[];
  isRemote: boolean;
  closesOn: string | null;
};
type Ranked = { id: string; matchScore: number; reason: string };
type JobApplication = {
  id: string;
  jobId: string;
  title: string;
  company: string;
  status: string;
  appliedAt: string;
};
type DocumentDetail = { id: string; name: string; type: string; createdAt: string };

const typeLabels: Record<string, string> = {
  internship: "Internship", graduate_programme: "Graduate Programme", part_time: "Part-time",
};
const tabs = [
  { id: "all", label: "All" },
  { id: "internship", label: "Internship" },
  { id: "graduate_programme", label: "Graduate Programme" },
  { id: "part_time", label: "Part-time" },
];
const views = [
  { id: "browse", label: "Browse" },
  { id: "applied", label: "Applied" },
  { id: "saved", label: "Saved" },
] as const;
type View = (typeof views)[number]["id"];

const appStatusLabels: Record<string, string> = {
  applied: "Applied", viewed: "Viewed", interview: "Interview",
  offer: "Offer", rejected: "Rejected", withdrawn: "Withdrawn",
};
function typeTone(t: string): Tone {
  return t === "internship" ? "indigo" : t === "graduate_programme" ? "primary" : "amber";
}
function appStatusTone(s: string): Tone {
  switch (s) {
    case "offer": return "emerald";
    case "interview": return "indigo";
    case "rejected":
    case "withdrawn": return "rose";
    case "viewed": return "amber";
    default: return "primary"; // applied
  }
}

function JobHub() {
  const qc = useQueryClient();
  const [view, setView] = useState<View>("browse");
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  // Optimistically-applied ids (also set when the API returns 409 = already applied).
  const [appliedLocal, setAppliedLocal] = useState<string[]>([]);
  // A CV is required to apply. When a student applies without one, we hold the
  // job id here and open the upload modal, then auto-continue the application.
  const [cvModalJobId, setCvModalJobId] = useState<string | null>(null);
  const cvFileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["jobs", tab, query],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (tab !== "all") qs.set("type", tab);
      if (query) qs.set("q", query);
      return api.get<Job[]>(`/api/Jobs?${qs.toString()}`);
    },
  });
  const { data: recommended } = useQuery({
    queryKey: ["jobs", "recommended"],
    queryFn: () => api.get<Ranked[]>("/api/Jobs/recommended"),
  });
  // Loaded eagerly (not just on the Applied tab) so Browse/Saved can show which
  // jobs are already applied to and disable their Apply buttons.
  const mine = useQuery({
    queryKey: ["jobs", "mine"],
    queryFn: () => api.get<JobApplication[]>("/api/Jobs/mine"),
  });
  const savedJobs = useQuery({
    queryKey: ["jobs", "saved"],
    queryFn: () => api.get<Job[]>("/api/Jobs/saved"),
    enabled: view === "saved",
  });
  // The student's documents — used to find their CV (required to apply to a job).
  const documents = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.get<DocumentDetail[]>("/api/Documents"),
  });
  const cvDoc = (documents.data ?? []).find((d) => d.type === "cv") ?? null;
  const hasCv = !!cvDoc;

  const save = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on ? api.post(`/api/Jobs/${id}/save`) : api.del(`/api/Jobs/${id}/save`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs", "saved"] }),
  });
  const apply = useMutation({
    mutationFn: ({ id, cvDocumentId }: { id: string; cvDocumentId: string }) =>
      api.post(`/api/Jobs/${id}/apply`, { cvDocumentId }),
    onSuccess: (_data, { id }) => {
      setAppliedLocal((p) => (p.includes(id) ? p : [...p, id]));
      qc.invalidateQueries({ queryKey: ["jobs", "mine"] });
    },
    onError: (err, { id }) => {
      // 409 = the student already applied to this job — treat it as applied.
      if (err instanceof ApiError && err.status === 409) {
        setAppliedLocal((p) => (p.includes(id) ? p : [...p, id]));
        qc.invalidateQueries({ queryKey: ["jobs", "mine"] });
      }
    },
  });

  // Upload a CV document (document_type = "cv"), then continue any pending apply.
  const uploadCv = useMutation({
    mutationFn: (file: File) => uploadDocument(file, "cv"),
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      if (cvModalJobId) {
        const jobId = cvModalJobId;
        setCvModalJobId(null);
        apply.mutate({ id: jobId, cvDocumentId: doc.id });
      }
    },
  });

  const jobs = data ?? [];
  const scoreById = new Map((recommended ?? []).map((r) => [r.id, r.matchScore]));
  const recJobs = (recommended ?? []).map((r) => jobs.find((j) => j.id === r.id)).filter(Boolean).slice(0, 2) as Job[];
  const appliedIds = new Set([...(mine.data ?? []).map((a) => a.jobId), ...appliedLocal]);
  const isApplied = (id: string) => appliedIds.has(id);
  const isApplying = (id: string) => apply.isPending && apply.variables?.id === id;

  // Gate: a CV must exist before applying. Otherwise open the upload modal.
  function handleApply(id: string) {
    if (cvDoc) apply.mutate({ id, cvDocumentId: cvDoc.id });
    else setCvModalJobId(id);
  }
  function onCvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadCv.mutate(file);
    e.target.value = "";
  }

  function toggleSave(id: string) {
    const has = saved.includes(id);
    setSaved((p) => (has ? p.filter((x) => x !== id) : [...p, id]));
    save.mutate({ id, on: !has });
  }

  function renderJobCard(j: Job) {
    return (
      <div key={j.id} className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-(--shadow-card) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-md) sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-brand-cyan text-sm font-bold text-white">
          {j.company.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{j.title}</h3>
            <StatusPill tone={typeTone(j.type)} dot={false}>{typeLabels[j.type] ?? j.type}</StatusPill>
            {scoreById.get(j.id) != null && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-600">{scoreById.get(j.id)}% match</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {j.company}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {j.location ?? (j.isRemote ? "Remote" : "—")}</span>
            {j.salaryText && <span className="inline-flex items-center gap-1"><Banknote className="h-3.5 w-3.5" /> {j.salaryText}</span>}
            {j.closesOn && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> closes {new Date(j.closesOn).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" })}</span>}
          </div>
          {j.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {j.tags.map((t) => <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{t}</span>)}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={() => toggleSave(j.id)} aria-label="Save job"
            className={cn("rounded-lg border p-2.5 transition-colors", saved.includes(j.id) ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
            {saved.includes(j.id) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
          {isApplied(j.id) ? (
            <button disabled className={cn(btn.outline, "cursor-default text-emerald-600")}>
              <Check className="h-4 w-4" /> Applied
            </button>
          ) : (
            <button onClick={() => handleApply(j.id)} disabled={isApplying(j.id)} className={btn.primary}>
              {isApplying(j.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Apply <ArrowRight className="h-4 w-4" /></>}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <StudentShell>
      <input ref={cvFileRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={onCvFile} />

      <PageHeader icon={Briefcase} eyebrow="Opportunities" title="Job Hub"
        subtitle="Find internships, graduate programmes and part-time work matched to your qualification."
        actions={
          <button
            className={btn.primary}
            disabled={uploadCv.isPending}
            onClick={() => { setCvModalJobId(null); cvFileRef.current?.click(); }}
          >
            {uploadCv.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : hasCv ? <Check className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
            {hasCv ? "CV on file" : "Upload CV"}
          </button>
        } />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} tone="primary" label="Open opportunities" value={jobs.length} />
        <StatCard icon={Sparkles} tone="indigo" label="Matched to you" value={recommended?.length ?? "—"} />
        <StatCard icon={Bookmark} tone="amber" label="Saved jobs" value={saved.length} />
        <StatCard icon={GraduationCap} tone="emerald" label="Remote roles" value={jobs.filter((j) => j.isRemote).length} />
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
          {recJobs.length > 0 && (
            <Panel className="mb-6" title="Recommended for you" description="AI-matched to your qualification, skills and interests"
              icon={Sparkles} tone="indigo" action={<StatusPill tone="indigo" dot={false}>AI powered</StatusPill>}>
              <div className="grid gap-4 md:grid-cols-2">
                {recJobs.map((j) => (
                  <div key={j.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-brand-cyan text-xs font-bold text-white">
                      {j.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="truncate text-sm font-semibold">{j.title}</h4>
                        {scoreById.get(j.id) != null && <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-600">{scoreById.get(j.id)}% match</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{j.company} · {j.location ?? (j.isRemote ? "Remote" : "")}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {isApplied(j.id) ? (
                          <span className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold text-emerald-600"><Check className="h-3.5 w-3.5" /> Applied</span>
                        ) : (
                          <button onClick={() => handleApply(j.id)} disabled={isApplying(j.id)} className={cn(btn.soft, "h-7 px-3 py-0 text-xs")}>
                            {isApplying(j.id) ? "Applying…" : "Apply now"}
                          </button>
                        )}
                        <button onClick={() => toggleSave(j.id)} className="text-xs font-medium text-muted-foreground hover:text-foreground">{saved.includes(j.id) ? "Saved" : "Save"}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search job titles or companies…"
                className="w-full rounded-lg border border-border/70 bg-card py-2.5 pl-9 pr-3 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25" />
            </div>
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
          {isError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">Couldn't load jobs.</div>}

          {!isLoading && !isError && (
            <div className="space-y-3">
              {jobs.map(renderJobCard)}
              {jobs.length === 0 && <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">No opportunities match your search.</div>}
            </div>
          )}
        </>
      )}

      {view === "applied" && (
        <>
          {mine.isLoading && <ListSkeleton rows={5} />}
          {mine.isError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">Couldn't load your applications.</div>}

          {!mine.isLoading && !mine.isError && (
            <div className="space-y-3">
              {(mine.data ?? []).map((a) => (
                <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-(--shadow-card) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-md)">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-brand-cyan text-sm font-bold text-white">
                    {a.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{a.title}</h3>
                      <StatusPill tone={appStatusTone(a.status)} dot={false}>{appStatusLabels[a.status] ?? a.status}</StatusPill>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {a.company}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Applied {new Date(a.appliedAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(mine.data ?? []).length === 0 && <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">You haven't applied to any jobs yet.</div>}
            </div>
          )}
        </>
      )}

      {view === "saved" && (
        <>
          {savedJobs.isLoading && <CardGridSkeleton columns="grid-cols-1" />}
          {savedJobs.isError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">Couldn't load saved jobs.</div>}

          {!savedJobs.isLoading && !savedJobs.isError && (
            <div className="space-y-3">
              {(savedJobs.data ?? []).map(renderJobCard)}
              {(savedJobs.data ?? []).length === 0 && <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">You haven't saved any jobs yet.</div>}
            </div>
          )}
        </>
      )}

      {cvModalJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !uploadCv.isPending && setCvModalJobId(null)}>
          <div className="relative w-full max-w-md rounded-2xl bg-card p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setCvModalJobId(null)}
              disabled={uploadCv.isPending}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold">Upload your CV to apply</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              You need a CV on file before you can apply for jobs. Upload one now and we&apos;ll continue your application automatically.
            </p>
            {uploadCv.isError && (
              <p className="mt-3 text-sm text-rose-600">Couldn&apos;t upload your CV. Please try again.</p>
            )}
            <div className="mt-6 flex justify-center gap-2">
              <button className={btn.outline} disabled={uploadCv.isPending} onClick={() => setCvModalJobId(null)}>Cancel</button>
              <button className={btn.primary} disabled={uploadCv.isPending} onClick={() => cvFileRef.current?.click()}>
                {uploadCv.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Choose CV file
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">PDF or Word document</p>
          </div>
        </div>
      )}
    </StudentShell>
  );
}
