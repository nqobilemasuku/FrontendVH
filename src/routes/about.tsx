/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Target, Heart, Sparkles, Users, GraduationCap, Globe2 } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Varsity Hub" },
      { name: "description", content: "Learn about Varsity Hub, South Africa's student first platform for university discovery, eligibility checks and applications." },
      { property: "og:title", content: "About Varsity Hub" },
      { property: "og:description", content: "We're building South Africa's most student friendly path to higher education." },
    ],
  }),
  component: About,
});

const values = [
  { icon: Target, title: "Student first", desc: "Every decision starts with the learner. We remove friction, jargon and guesswork from applying to university." },
  { icon: Heart, title: "Access for all", desc: "From rural townships to city suburbs. Your postcode shouldn't decide your future." },
  { icon: Sparkles, title: "Built with care", desc: "Modern, secure and reliable tools, designed for the realities of South African students." },
];

const stats = [
  { value: "26+", label: "Public universities" },
  { value: "10k+", label: "Programmes indexed" },
  { value: "9", label: "Provinces covered" },
  { value: "24/7", label: "Application access" },
];

function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,oklch(0.95_0.05_295/0.5),transparent_60%)]" />
          <div className="mx-auto max-w-5xl px-6 py-20 text-center">
            <span className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">About us</span>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl">
              Building the bridge to <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-brand)" }}>higher education</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/70">
              Varsity Hub exists so every South African student can discover the right programme, check eligibility and apply without the chaos of juggling multiple portals.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-(--shadow-soft)">
                <div className="text-3xl font-extrabold text-primary">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Our mission</h2>
              <p className="mt-4 text-foreground/70">
                We believe that knowing what's possible should be the easy part. Varsity Hub brings every South African public university, qualification and entry requirement into one consistent experience, so students can spend their energy on choosing well, not chasing PDFs.
              </p>
              <p className="mt-4 text-foreground/70">
                Whether you're a Grade 12 learner, a parent, a teacher or a career counsellor, you'll find tools to plan, compare and apply with confidence.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {values.map((v) => (
                <div key={v.title} className="rounded-2xl border border-border/60 bg-card p-5 shadow-(--shadow-soft)">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary">
                    <v.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-bold">{v.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
                </div>
              ))}
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-(--shadow-soft)">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[oklch(0.95_0.05_230)] text-[oklch(0.5_0.18_240)]">
                  <Globe2 className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-bold">Proudly South African</h3>
                <p className="mt-1 text-sm text-muted-foreground">Built locally for local realities: data, languages and pathways that match how SA students actually apply.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-3xl border border-border/60 bg-card p-10 text-center shadow-(--shadow-card)">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold">Ready to take the next step?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Create a free student profile and start exploring programmes today.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="rounded-xl bg-primary px-7 py-3 font-semibold text-primary-foreground hover:bg-primary/90">Get Started</Link>
              <Link to="/universities" className="rounded-xl border-2 border-primary px-7 py-3 font-semibold text-primary hover:bg-primary/5">Browse Universities</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}