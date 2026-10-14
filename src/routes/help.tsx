/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { StudentShell } from "@/components/StudentShell";
import {
  Search,
  LifeBuoy,
  Mail,
  MessageSquare,
  Phone,
  BookOpen,
  FileText,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Plus,
} from "lucide-react";
import { PageHeader, Panel, IconBadge, btn, type Tone } from "@/components/dashboard/ui";
import type { ComponentType } from "react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Support · Varsity Hub" },
      { name: "description", content: "FAQs, guides and contact options for Varsity Hub students." },
    ],
  }),
  component: Help,
});

const topics: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  tone: Tone;
}[] = [
  {
    icon: BookOpen,
    title: "Getting started",
    desc: "Create your profile, verify your ID and add your matric results.",
    tone: "primary",
  },
  {
    icon: FileText,
    title: "Applications",
    desc: "Submit, track and edit applications across multiple universities.",
    tone: "blue",
  },
  {
    icon: CreditCard,
    title: "Fees & payments",
    desc: "Application fees, NSFAS guidance and payment methods.",
    tone: "emerald",
  },
  {
    icon: ShieldCheck,
    title: "Account & security",
    desc: "Reset your password, manage devices and keep your data safe.",
    tone: "violet",
  },
];

const faqs = [
  {
    q: "Is Varsity Hub free to use?",
    a: "Creating an account, exploring programmes and using career guidance is free. Some universities charge their own application fees.",
  },
  {
    q: "Which universities can I apply to?",
    a: "All 26 public South African universities are supported, with private institutions being added regularly.",
  },
  {
    q: "How do I calculate my APS?",
    a: "Add your top 6 matric subject scores (excluding Life Orientation). Our calculator does this automatically once you upload your results.",
  },
  {
    q: "What documents do I need?",
    a: "Typically your ID, latest results, proof of residence and a recent photo. Some programmes require additional portfolios or NBTs.",
  },
  {
    q: "Can I edit an application after submitting?",
    a: "Most universities allow edits before the closing date. Reopen the application from your dashboard to see what can be changed.",
  },
  {
    q: "How do I get support?",
    a: "Use Messages in your portal, email support@varsityhub.co.za, or call us during business hours.",
  },
];

function Help() {
  return (
    <StudentShell>
      <PageHeader
        icon={LifeBuoy}
        eyebrow="Account"
        title="Help & Support"
        subtitle="Find answers or reach our team. We're here to help."
        actions={
          <Link to="/messages" className={btn.primary}>
            <MessageSquare className="h-4 w-4" /> Contact support
          </Link>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search articles, e.g. how to apply"
          className="w-full rounded-xl border border-border/70 bg-card py-3.5 pl-12 pr-4 text-sm shadow-(--shadow-soft) transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/25"
        />
      </div>

      {/* Topic cards */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topics.map((t) => (
          <button
            key={t.title}
            type="button"
            className="group rounded-2xl border border-border/70 bg-card p-5 text-left shadow-(--shadow-card) transition-all duration-200 hover:-translate-y-1 hover:shadow-(--shadow-md)"
          >
            <IconBadge icon={t.icon} tone={t.tone} size="lg" />
            <h3 className="mt-3 font-semibold">{t.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
          </button>
        ))}
      </section>

      {/* FAQ + contact */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Frequently asked questions" icon={LifeBuoy} flush>
          <div className="divide-y divide-border/60">
            {faqs.map((f) => (
              <details key={f.q} className="group px-5 py-4 transition-colors open:bg-muted/20">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                  {f.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-transform group-open:rotate-45">
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Contact us" icon={MessageSquare} tone="primary">
            <ul className="space-y-3">
              <ContactRow icon={Mail} title="Email" value="support@varsityhub.co.za" tone="primary" />
              <ContactRow
                icon={MessageSquare}
                title="Live chat"
                value="In Messages · 8am to 8pm"
                tone="blue"
              />
              <ContactRow icon={Phone} title="Phone" value="+27 10 000 0000" tone="emerald" />
            </ul>
          </Panel>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-brand p-6 text-white shadow-(--shadow-md)">
            <div className="bg-dots absolute inset-0 opacity-20" />
            <div className="relative">
              <LifeBuoy className="h-7 w-7" />
              <h3 className="mt-3 text-lg font-bold">Still stuck?</h3>
              <p className="mt-1 text-sm text-white/80">
                Message our support team directly from your portal.
              </p>
              <Link
                to="/messages"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-primary transition-transform hover:-translate-y-0.5"
              >
                Start a conversation <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StudentShell>
  );
}

function ContactRow({
  icon,
  title,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  value: string;
  tone: Tone;
}) {
  return (
    <li className="flex items-center gap-3">
      <IconBadge icon={icon} tone={tone} />
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{value}</div>
      </div>
    </li>
  );
}
