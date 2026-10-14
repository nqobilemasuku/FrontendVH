/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GraduationCap } from "lucide-react";
import { UniversitiesExplorer } from "@/components/UniversitiesExplorer";

export const Route = createFileRoute("/universities")({
  head: () => ({
    meta: [
      { title: "Universities · Varsity Hub" },
      { name: "description", content: "Browse and compare South African public universities by province, faculties and programmes." },
    ],
  }),
  component: Universities,
});

function Universities() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <header className="text-center">
          <span className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">Universities</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Explore South African Universities</h1>
          <p className="mx-auto mt-4 max-w-2xl text-foreground/70">Search, compare and save accredited institutions by province, programmes, admission requirements and tuition.</p>
        </header>

        <div className="mt-8">
          <UniversitiesExplorer />
        </div>

        <div className="mt-12 rounded-3xl border border-border/60 bg-accent/30 p-8 text-center">
          <GraduationCap className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-3 text-2xl font-extrabold">Not sure where to start?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Create a profile and we'll match you to universities that fit your APS and interests.</p>
          <Link to="/register" className="mt-5 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Get matched</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
