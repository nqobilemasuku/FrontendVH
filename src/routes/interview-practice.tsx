/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mic,
  Sparkles,
  Play,
  MessageSquareText,
  ThumbsUp,
  Lightbulb,
  Clock,
  ArrowRight,
  RotateCcw,
  Award,
  Bot,
  Briefcase,
  Code2,
  Users,
  Loader2,
} from "lucide-react";
import { StudentShell } from "@/components/StudentShell";
import {
  PageHeader,
  StatCard,
  Panel,
  StatusPill,
  ProgressBar,
  IconBadge,
  btn,
  type Tone,
} from "@/components/dashboard/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/interview-practice")({
  head: () => ({ meta: [{ title: "Interview Practice · Varsity Hub" }] }),
  component: InterviewPractice,
});

type Session = {
  id: string;
  category: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
};

type Feedback = {
  id: string;
  question: string;
  answer: string;
  clarity: number;
  confidence: number;
  relevance: number;
  structure: number;
  strengths: string[];
  improvements: string[];
};

type CategoryMeta = {
  id: string;
  title: string;
  desc: string;
  icon: typeof Briefcase;
  tone: Tone;
  question: string;
};

// The API expects a `category` slug; questions are UI prompts sent as the
// `question` field of each answer request (no questions endpoint exists yet).
const categories: CategoryMeta[] = [
  { id: "general", title: "General / Behavioural", desc: "Tell me about yourself, strengths & weaknesses", icon: Users, tone: "primary", question: "Tell me about a time you faced a challenge in a group project and how you handled it." },
  { id: "graduate", title: "Graduate Programme", desc: "Competency and situational questions", icon: Briefcase, tone: "indigo", question: "Describe a situation where you had to meet a tight deadline. How did you manage it?" },
  { id: "technical", title: "Technical (IT)", desc: "Problem-solving and role-specific questions", icon: Code2, tone: "emerald", question: "Walk me through how you would approach debugging a program that crashes intermittently." },
  { id: "bursary", title: "Bursary Interview", desc: "Motivation, goals and financial need", icon: Award, tone: "amber", question: "Why do you deserve this bursary, and how will it help you achieve your goals?" },
];

const catLabel: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.title]));

function InterviewPractice() {
  const qc = useQueryClient();
  const [active, setActive] = useState<CategoryMeta | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");

  const { data: sessions } = useQuery({
    queryKey: ["interview-sessions"],
    queryFn: () => api.get<Session[]>("/api/interview/sessions"),
  });

  const { data: priorFeedback } = useQuery({
    queryKey: ["interview-feedback", sessionId],
    enabled: !!sessionId,
    queryFn: () => api.get<Feedback[]>(`/api/interview/sessions/${sessionId}/feedback`),
  });

  const start = useMutation({
    mutationFn: (category: string) => api.post<Session>("/api/interview/sessions", { category }),
    onSuccess: (s) => {
      setSessionId(s.id);
      qc.invalidateQueries({ queryKey: ["interview-sessions"] });
    },
  });

  const submit = useMutation({
    mutationFn: () =>
      api.post<Feedback>(`/api/interview/sessions/${sessionId}/feedback`, {
        question: active?.question ?? "",
        answer,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interview-sessions"] });
      qc.invalidateQueries({ queryKey: ["interview-feedback", sessionId] });
    },
  });

  const sessionList = sessions ?? [];
  const scored = sessionList.filter((s) => s.score != null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((a, s) => a + (s.score ?? 0), 0) / scored.length)
    : null;
  const bestScore = scored.length ? Math.max(...scored.map((s) => s.score ?? 0)) : null;
  const categoriesPractised = new Set(sessionList.map((s) => s.category)).size;

  function pickCategory(c: CategoryMeta) {
    setActive(c);
    setAnswer("");
    submit.reset();
    start.mutate(c.id);
  }

  function endSession() {
    setActive(null);
    setSessionId(null);
    setAnswer("");
    submit.reset();
  }

  const latest = submit.data;

  return (
    <StudentShell>
      <PageHeader
        icon={Mic}
        eyebrow="Opportunities"
        title="Interview Practice"
        subtitle="Practise with an AI interviewer and get instant feedback to build your confidence."
        actions={<StatusPill tone="indigo" dot={false}><Bot className="mr-1 h-3.5 w-3.5" /> AI powered</StatusPill>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Mic} tone="primary" label="Sessions" value={sessions ? sessionList.length : "—"} />
        <StatCard icon={Award} tone="emerald" label="Average score" value={avgScore != null ? `${avgScore}%` : "—"} />
        <StatCard icon={Sparkles} tone="indigo" label="Best score" value={bestScore != null ? `${bestScore}%` : "—"} />
        <StatCard icon={Clock} tone="amber" label="Categories practised" value={categoriesPractised || "—"} />
      </div>

      {/* Choose a category */}
      <Panel title="Start a mock interview" description="Pick a category to begin your AI-guided session" icon={Play} className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => pickCategory(c)}
              disabled={start.isPending}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-card)",
                active?.id === c.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/60",
              )}
            >
              <IconBadge icon={c.icon} tone={c.tone} size="lg" />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold">{c.title}</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
              </div>
            </button>
          ))}
        </div>
        {start.isError && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            Couldn't start a session. Please try again.
          </p>
        )}
      </Panel>

      {/* Active session simulator */}
      {active && (
        <Panel
          title={`${active.title} interview`}
          description={sessionId ? "Answer the question below" : "Starting session…"}
          icon={MessageSquareText}
          tone={active.tone}
          className="mb-6"
          action={<button onClick={endSession} className={btn.ghost}>End session</button>}
        >
          <div className="rounded-xl bg-linear-to-br from-primary/5 to-brand-cyan/5 p-5">
            <div className="flex items-start gap-3">
              <IconBadge icon={Bot} tone="indigo" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">AI Interviewer</p>
                <p className="mt-1 text-sm font-medium">&ldquo;{active.question}&rdquo;</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="text-xs font-semibold text-muted-foreground">Your answer</label>
            <textarea
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer…"
              className="mt-1.5 w-full rounded-lg border border-border/60 bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => submit.mutate()}
                disabled={!sessionId || !answer.trim() || submit.isPending}
                className={btn.primary}
              >
                {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit for feedback <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {submit.isError && (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                Couldn't get feedback. Please try again.
              </p>
            )}
          </div>
        </Panel>
      )}

      {/* AI feedback report (latest submitted answer) */}
      {latest && <FeedbackReport feedback={latest} />}

      {/* Prior feedback for this session */}
      {sessionId && (priorFeedback?.length ?? 0) > 1 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Earlier answers this session</h3>
          {(priorFeedback ?? [])
            .filter((f) => f.id !== latest?.id)
            .map((f) => (
              <FeedbackReport key={f.id} feedback={f} compact />
            ))}
        </div>
      )}

      {/* Session history */}
      {sessionList.length > 0 && (
        <Panel title="Session history" description="Your past mock interviews" icon={Clock} className="mt-6">
          <ul className="divide-y divide-border/50">
            {sessionList.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{catLabel[s.category] ?? s.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.startedAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}
                    {s.completedAt ? " · completed" : " · in progress"}
                  </p>
                </div>
                {s.score != null ? (
                  <StatusPill tone={s.score >= 75 ? "emerald" : s.score >= 50 ? "amber" : "rose"} dot={false}>
                    {s.score}%
                  </StatusPill>
                ) : (
                  <StatusPill tone="slate" dot={false}>Not scored</StatusPill>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </StudentShell>
  );
}

/* --------------------------- FeedbackReport --------------------------- */

function FeedbackReport({ feedback, compact }: { feedback: Feedback; compact?: boolean }) {
  const scores: { label: string; value: number; tone: Tone }[] = [
    { label: "Clarity", value: feedback.clarity, tone: "emerald" },
    { label: "Confidence", value: feedback.confidence, tone: "primary" },
    { label: "Relevance", value: feedback.relevance, tone: "indigo" },
    { label: "Structure", value: feedback.structure, tone: "amber" },
  ];
  const overall = Math.round(
    (feedback.clarity + feedback.confidence + feedback.relevance + feedback.structure) / 4,
  );
  const blocks = [
    { icon: ThumbsUp, tone: "emerald" as Tone, label: "Strengths", items: feedback.strengths },
    { icon: Lightbulb, tone: "amber" as Tone, label: "To improve", items: feedback.improvements },
  ];

  return (
    <Panel
      title="AI feedback"
      description={compact ? feedback.question : "Instant analysis of your last answer"}
      icon={Sparkles}
      tone="indigo"
      className={compact ? undefined : "mt-6"}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {blocks.map((b) => (
            <div key={b.label} className="rounded-xl border border-border/60 p-4">
              <div className="flex items-center gap-2">
                <IconBadge icon={b.icon} tone={b.tone} size="sm" />
                <h4 className="text-sm font-semibold">{b.label}</h4>
              </div>
              {b.items.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {b.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", b.tone === "emerald" ? "bg-emerald-500" : "bg-amber-500")} />
                      {it}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">None noted.</p>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Score breakdown</h4>
            <span className="text-2xl font-bold text-primary">
              {overall}
              <span className="text-sm text-muted-foreground">/100</span>
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {scores.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold tabular-nums">{s.value}%</span>
                </div>
                <ProgressBar value={s.value} tone={s.tone} />
              </div>
            ))}
          </div>
          {!compact && (
            <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Submit another answer to keep practising.
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}
