import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UniversityAdminShell } from "@/components/UniversityAdminShell";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Activity,
  StickyNote,
  CheckCircle2,
  XCircle,
  FileUp,
  Users,
} from "lucide-react";
import { Panel, StatusPill, btn, type Tone } from "@/components/dashboard/ui";
import { PanelSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";

export const Route = createFileRoute("/uni-admin-application-details")({
  head: () => ({ meta: [{ title: "Application Details · Varsity Hub" }] }),
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: UniAdminApplicationDetails,
});

type UniApplicationDto = {
  id: string;
  studentName: string;
  programmeName: string;
  status: string;
  apsAtApply: number | null;
  createdAt: string;
  updatedAt: string;
};

type UniApplicationDetail = {
  id: string;
  studentId: string;
  studentNumber?: string | null;
  applicantName: string;
  applicantEmail: string | null;
  programme: string;
  university: string;
  status: string;
  apsAtApply: number | null;
  currentAps: number | null;
  notes: string | null;
  missingDocumentTypes?: string[] | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  pending_documents: "Pending Documents",
  approved: "Approved",
  waitlisted: "Waitlisted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};
function statusLabel(s: string) {
  return STATUS_LABELS[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const DOC_TYPE_LABELS: Record<string, string> = {
  matric_certificate: "Matric Certificate",
  id_document: "ID Document",
  proof_of_residence: "Proof of Residence",
  academic_transcript: "Academic Transcript",
  passport: "Passport",
};
function docTypeLabel(t: string) {
  return DOC_TYPE_LABELS[t] ?? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function shortId(id?: string | null) {
  return id ? id.slice(0, 8).toUpperCase() : "—";
}
function statusTone(s: string): Tone {
  switch (s) {
    case "approved":
      return "emerald";
    case "rejected":
      return "rose";
    case "under_review":
      return "amber";
    case "pending_documents":
      return "orange";
    case "submitted":
      return "blue";
    case "waitlisted":
      return "violet";
    default:
      return "slate";
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const actions: { label: string; status: string; className: string; icon: typeof CheckCircle2 }[] = [
  { label: "Approve", status: "approved", className: btn.primary, icon: CheckCircle2 },
  { label: "Reject", status: "rejected", className: btn.destructive, icon: XCircle },
  { label: "Waitlist", status: "waitlisted", className: btn.outline, icon: Users },
  { label: "Request Documents", status: "pending_documents", className: btn.outline, icon: FileUp },
];

function UniAdminApplicationDetails() {
  const qc = useQueryClient();
  const { id: searchId } = Route.useSearch();
  const [note, setNote] = useState("");

  // Resolve the application id: from search param, else first in the list.
  const { data: list, isLoading: listLoading, isError: listError } = useQuery({
    queryKey: ["uni-admin", "applications", "all"],
    queryFn: () => api.get<UniApplicationDto[]>("/api/uni-admin/applications?"),
  });
  const appId = searchId ?? list?.[0]?.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["uni-admin", "application", appId],
    queryFn: () => api.get<UniApplicationDetail>(`/api/uni-admin/applications/${appId}`),
    enabled: !!appId,
  });

  const changeStatus = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/api/uni-admin/applications/${appId}/status`, { status, note: note || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["uni-admin", "application", appId] });
      qc.invalidateQueries({ queryKey: ["uni-admin", "applications"] });
      qc.invalidateQueries({ queryKey: ["uni-admin", "summary"] });
      setNote("");
    },
  });

  const loading = listLoading || (!!appId && isLoading);
  const errored = listError || isError;

  return (
    <UniversityAdminShell>
      <div className="mb-4">
        <Link
          to={"/uni-admin-applications" as any}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Link>
      </div>

      {loading && <PanelSkeleton lines={6} />}
      {errored && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load the application.
        </div>
      )}
      {!loading && !errored && !appId && (
        <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
          No applications available to review.
        </div>
      )}

      {!loading && !errored && data && (
        <>
          {/* Applicant header */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-(--shadow-card)">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-cyan-400 text-lg font-bold text-white shadow-(--shadow-soft)">
                  {initials(data.applicantName)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-bold tracking-tight">{data.applicantName}</h1>
                    <StatusPill tone={statusTone(data.status)}>{statusLabel(data.status)}</StatusPill>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-mono text-[13px] text-blue-600">{data.id}</span>
                    <span>{data.programme}</span>
                    <span>{data.university}</span>
                    <span>Submitted {fmtDate(data.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {actions.map((a) => (
                  <button
                    key={a.status}
                    onClick={() => changeStatus.mutate(a.status)}
                    disabled={changeStatus.isPending || data.status === a.status}
                    className={a.className}
                  >
                    <a.icon className="h-4 w-4" />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-6 lg:col-span-2">
              <Panel title="Applicant Information" icon={User} tone="blue">
                <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Full Name</dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">{data.applicantName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">{data.applicantEmail ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Student Number</dt>
                    <dd className="mt-0.5 font-mono text-sm font-medium text-foreground">
                      {data.studentNumber ?? shortId(data.studentId)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">University</dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">{data.university}</dd>
                  </div>
                </dl>
              </Panel>

              <Panel title="Programme & Academics" icon={GraduationCap} tone="blue" flush>
                <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60">
                  <div className="px-5 py-4">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">APS at Apply</div>
                    <div className="mt-1 text-3xl font-bold tabular-nums text-blue-600">{data.apsAtApply ?? "—"}</div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current APS</div>
                    <div className="mt-1 text-3xl font-bold tabular-nums">{data.currentAps ?? "—"}</div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</div>
                    <div className="mt-1 text-base font-semibold">{statusLabel(data.status)}</div>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Programme</div>
                  <div className="mt-0.5 text-sm font-medium text-foreground">{data.programme}</div>
                </div>
              </Panel>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <Panel title="Application Status" icon={Activity} tone="blue">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current status</span>
                    <StatusPill tone={statusTone(data.status)}>{statusLabel(data.status)}</StatusPill>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{fmtDate(data.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last updated</span>
                    <span className="font-medium">{fmtDate(data.updatedAt)}</span>
                  </div>
                </div>
              </Panel>

              <Panel title="Outstanding Documents" icon={FileUp} tone="blue">
                {(data.missingDocumentTypes?.length ?? 0) > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {data.missingDocumentTypes!.map((t) => (
                      <li key={t} className="flex items-center gap-2 text-foreground">
                        <XCircle className="h-4 w-4 shrink-0 text-orange-500" />
                        {docTypeLabel(t)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No outstanding documents.</p>
                )}
              </Panel>

              <Panel title="Reviewer Notes" icon={StickyNote} tone="blue">
                {data.notes && (
                  <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 text-sm text-foreground">
                    {data.notes}
                  </div>
                )}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-3 w-full resize-none rounded-xl border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) transition-shadow placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                  rows={3}
                  placeholder="Add a note before changing status…"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Notes are attached to the status change action above.
                </p>
              </Panel>
            </div>
          </div>
        </>
      )}
    </UniversityAdminShell>
  );
}
