/* eslint-disable prettier/prettier */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentShell } from "@/components/StudentShell";
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Send, CreditCard } from "lucide-react";
import { PageHeader, Panel, StatusPill, btn } from "@/components/dashboard/ui";
import { PanelSkeleton } from "@/components/dashboard/skeletons";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { getFeeStatus, startFeePayment, APPLICATION_FEE } from "@/lib/payments";

export const Route = createFileRoute("/application-form")({
  head: () => ({ meta: [{ title: "Application Form · Varsity Hub" }] }),
  component: ApplicationForm,
});

type ProgrammeDto = {
  id: string;
  name: string;
  qualification: string;
  minAps: number | null;
  university: string;
  shortCode: string;
};
type NewApplication = { programmeId: string; universityId: string };
type UniLite = { id: string; name: string; shortCode: string };

const steps = ["Personal Info", "Academic Results", "Programme", "Documents", "Review & Submit"];

const qualificationLabels: Record<string, string> = {
  bachelors: "Bachelor's Degree",
  diploma: "Diploma",
  higher_certificate: "Higher Certificate",
  postgraduate: "Postgraduate",
};

function ApplicationForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [programmeId, setProgrammeId] = useState("");

  const { data: programmes, isLoading, isError } = useQuery({
    queryKey: ["programmes"],
    queryFn: () => api.get<ProgrammeDto[]>("/api/Programmes"),
  });

  // ProgrammeDto only carries the university *name*; resolve it to a real
  // university id (the GUID NewApplication.universityId expects) via the catalog.
  const { data: universities } = useQuery({
    queryKey: ["universities", "all"],
    queryFn: () => api.get<UniLite[]>("/api/Universities", { auth: false }),
  });

  const selected = (programmes ?? []).find((p) => p.id === programmeId) ?? null;
  // Match on shortCode first (stable), fall back to name.
  const selectedUniId = selected
    ? (universities ?? []).find((u) => u.shortCode === selected.shortCode)?.id ??
      (universities ?? []).find((u) => u.name === selected.university)?.id ??
      null
    : null;

  // The backend requires a paid application fee before an application can be created.
  const { data: fee, isLoading: feeLoading, refetch: refetchFee } = useQuery({
    queryKey: ["fee-status"],
    queryFn: getFeeStatus,
  });

  const pay = useMutation({
    mutationFn: startFeePayment,
    onSuccess: (r) => {
      if (r.checkoutUrl) window.location.href = r.checkoutUrl;
    },
  });

  const submit = useMutation({
    mutationFn: (body: NewApplication) => api.post("/api/Applications", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      navigate({ to: "/applications" });
    },
    onError: (e) => {
      // Fee not paid / expired — flip back to the fee gate.
      if (e instanceof ApiError && (e.status === 409 || /fee/i.test(e.message))) refetchFee();
    },
  });

  const last = steps.length - 1;
  const canAdvance = step !== 2 || programmeId !== "";

  function doSubmit() {
    if (!selected || !selectedUniId) return;
    submit.mutate({ programmeId: selected.id, universityId: selectedUniId });
  }

  return (
    <StudentShell>
      <PageHeader
        icon={GraduationCap}
        eyebrow="Applications"
        title="Application Form"
        subtitle={`Step ${step + 1} of ${steps.length}`}
      />

      {feeLoading && <PanelSkeleton lines={3} />}

      {/* Fee gate — student must pay the once-off application fee first */}
      {!feeLoading && fee && !fee.paid && (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-800">Application fee required</h3>
              <p className="mt-0.5 text-sm text-amber-700/90">
                Pay the once-off application fee of R&nbsp;{APPLICATION_FEE} to unlock your applications.
              </p>
              {pay.isError && (
                <p className="mt-1 text-xs font-medium text-rose-600">Couldn&apos;t start the payment. Please try again.</p>
              )}
            </div>
          </div>
          <button onClick={() => pay.mutate()} disabled={pay.isPending} className={cn(btn.primary, "shrink-0")}>
            {pay.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Pay application fee
          </button>
        </div>
      )}

      {!feeLoading && fee?.paid && (
      <>
      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full text-xs font-bold",
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span className={cn("whitespace-nowrap text-sm", i === step ? "font-semibold text-primary" : "text-muted-foreground")}>{s}</span>
            {i < steps.length - 1 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      <Panel>
        {step === 0 && (
          <div>
            <h3 className="font-semibold">Personal Information</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We'll use the personal details from your profile for this application. Make sure your
              profile is up to date before submitting.
            </p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 className="font-semibold">Academic Results</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your captured Grade 12 results and APS will be attached automatically. Update them on the
              Academic Results page if needed.
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-semibold">Choose a programme</h3>
            <p className="mt-1 text-sm text-muted-foreground">Select the programme you'd like to apply for.</p>

            {isLoading && <PanelSkeleton lines={2} className="mt-4" />}
            {isError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Couldn't load programmes.
              </div>
            )}
            {!isLoading && !isError && (
              <div className="mt-4">
                <label className="text-xs font-semibold text-foreground">Programme</label>
                <select
                  value={programmeId}
                  onChange={(e) => setProgrammeId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select a programme…</option>
                  {(programmes ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.university}
                    </option>
                  ))}
                </select>

                {selected && (
                  <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold">{selected.name}</h4>
                      <StatusPill tone="indigo" dot={false}>{selected.shortCode}</StatusPill>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selected.university} · {qualificationLabels[selected.qualification] ?? selected.qualification}
                      {selected.minAps != null && ` · Min APS ${selected.minAps}`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="font-semibold">Documents</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your uploaded documents (ID, results, proof of residence) will be shared with the
              university. Manage them on the Documents page.
            </p>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="font-semibold">Review &amp; Submit</h3>
            <p className="mt-1 text-sm text-muted-foreground">Confirm your selection before submitting.</p>
            {selected ? (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selected.university} · {qualificationLabels[selected.qualification] ?? selected.qualification}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                Please choose a programme in step 3 before submitting.
              </div>
            )}
            {submit.isError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Couldn't submit your application. Please try again.
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <div className="mt-6 flex justify-between">
          <button
            className={btn.outline}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submit.isPending}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < last ? (
            <button className={btn.primary} onClick={() => setStep((s) => Math.min(last, s + 1))} disabled={!canAdvance}>
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button className={btn.primary} onClick={doSubmit} disabled={!selected || !selectedUniId || submit.isPending}>
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit application
            </button>
          )}
        </div>
      </Panel>
      </>
      )}
    </StudentShell>
  );
}
