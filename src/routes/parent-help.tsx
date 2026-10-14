import { createFileRoute } from "@tanstack/react-router";
import { ParentShell } from "@/components/ParentShell";
import {
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  ArrowRight,
  Clock,
  Headset,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  IconBadge,
  type Tone,
} from "@/components/dashboard/ui";

export const Route = createFileRoute("/parent-help")({
  head: () => ({ meta: [{ title: "Help & Support · Varsity Hub" }] }),
  component: ParentHelp,
});

const quickActions = [
  {
    icon: Mail,
    title: "Contact Support",
    description: "Send us an email and we'll respond within 24 hours.",
    action: "Send Email",
    tone: "blue" as Tone,
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Chat",
    description: "Chat with our support team on WhatsApp instantly.",
    action: "Open WhatsApp",
    tone: "emerald" as Tone,
  },
  {
    icon: Phone,
    title: "Call Centre",
    description: "Speak to an agent directly. Free call 0800 123 456.",
    action: "0800 123 456",
    tone: "violet" as Tone,
  },
];

const faqs = [
  {
    question: "How do I link my child's profile to my account?",
    answer: "Go to Settings > Link Student and enter your child's student ID. They will receive a confirmation notification to approve the link.",
  },
  {
    question: "Can I apply on behalf of my child?",
    answer: "No. Applications must be submitted by the student. You can monitor their progress here in the Parent Portal.",
  },
  {
    question: "How do I know if a document is missing?",
    answer: "The Documents Missing counter on your dashboard will alert you. You can also view the Documents section in your child's profile for a full checklist.",
  },
  {
    question: "What does \"Pending Documents\" status mean?",
    answer: "The university has requested additional documents from your child. Check the Applications page for details on what is required and by when.",
  },
  {
    question: "How will I be notified of an offer?",
    answer: "You will receive an in app notification, an email, and an SMS when your child receives an offer from a university.",
  },
  {
    question: "Can I add multiple children to my account?",
    answer: "Yes. Go to Settings > Linked Students to add another learner. Each learner must approve the link from their own account.",
  },
];

function ParentHelp() {
  return (
    <ParentShell>
      <PageHeader
        eyebrow="Parent / Guardian"
        title="Help & Support"
        subtitle="Find answers and get support for navigating Varsity Hub."
        icon={HelpCircle}
        tone="emerald"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <div
              key={a.title}
              className="group flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-(--shadow-card) transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-md)"
            >
              <IconBadge icon={Icon} tone={a.tone} size="lg" />
              <h3 className="mt-4 font-semibold">{a.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{a.description}</p>
              <button className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700">
                {a.action}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          );
        })}
      </div>

      <Panel
        className="mt-6"
        title="Frequently Asked Questions"
        description="Answers to common questions from parents and guardians"
        icon={HelpCircle}
        tone="emerald"
      >
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40"
            >
              <p className="flex items-start gap-2 text-sm font-semibold">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-[11px] font-bold text-emerald-600">
                  Q
                </span>
                {f.question}
              </p>
              <p className="mt-2 pl-7 text-sm text-muted-foreground">{f.answer}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <IconBadge icon={Headset} tone="emerald" size="lg" />
          <div>
            <p className="text-sm font-semibold">Still need help?</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Our support team is here to help you and Lindiwe succeed.
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Clock className="h-3.5 w-3.5" />
              Mon to Fri, 08:00 to 17:00 SAST
            </p>
          </div>
        </div>
      </div>
    </ParentShell>
  );
}
