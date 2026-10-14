import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Search, Cpu, Stethoscope, Scale, Calculator, Palette, Wrench, Leaf, BookOpen } from "lucide-react";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "Programs · Varsity Hub" },
      { name: "description", content: "Discover thousands of university programmes across South Africa, filtered by faculty, APS and qualification type." },
      { property: "og:title", content: "University Programmes" },
      { property: "og:description", content: "Find your degree, diploma or certificate across SA universities." },
    ],
  }),
  component: Programs,
});

const faculties = [
  { icon: Cpu, name: "Information Technology", count: 420, color: "bg-[oklch(0.95_0.05_260)] text-[oklch(0.5_0.2_270)]" },
  { icon: Stethoscope, name: "Health Sciences", count: 280, color: "bg-[oklch(0.95_0.05_25)] text-[oklch(0.5_0.2_25)]" },
  { icon: Scale, name: "Law", count: 95, color: "bg-[oklch(0.95_0.05_60)] text-[oklch(0.45_0.18_60)]" },
  { icon: Calculator, name: "Business & Finance", count: 560, color: "bg-[oklch(0.95_0.05_150)] text-[oklch(0.45_0.18_160)]" },
  { icon: Palette, name: "Creative Arts", count: 210, color: "bg-[oklch(0.95_0.05_320)] text-[oklch(0.5_0.2_320)]" },
  { icon: Wrench, name: "Engineering", count: 340, color: "bg-[oklch(0.95_0.05_230)] text-[oklch(0.5_0.18_240)]" },
  { icon: Leaf, name: "Agriculture", count: 130, color: "bg-[oklch(0.95_0.05_140)] text-[oklch(0.45_0.18_150)]" },
  { icon: BookOpen, name: "Education", count: 240, color: "bg-[oklch(0.95_0.05_55)] text-[oklch(0.5_0.18_55)]" },
];

const featured = [
  { name: "BSc Computer Science", uni: "University of Cape Town", aps: 36, duration: "3 years", type: "Degree" },
  { name: "BCom Accounting", uni: "Stellenbosch University", aps: 34, duration: "3 years", type: "Degree" },
  { name: "MBChB Medicine", uni: "Wits University", aps: 42, duration: "6 years", type: "Degree" },
  { name: "Diploma in IT", uni: "University of Johannesburg", aps: 26, duration: "3 years", type: "Diploma" },
  { name: "BEng Mechanical", uni: "University of Pretoria", aps: 38, duration: "4 years", type: "Degree" },
  { name: "BA Psychology", uni: "Rhodes University", aps: 32, duration: "3 years", type: "Degree" },
];

function Programs() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <header className="text-center">
          <span className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">Programmes</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Find Your Programme</h1>
          <p className="mx-auto mt-4 max-w-2xl text-foreground/70">Search 10,000+ qualifications by faculty, APS and university. Filter to what fits your marks and interests.</p>
        </header>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-(--shadow-soft) sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search programmes, e.g. Computer Science" className="w-full rounded-lg border border-border/60 bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select className="rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm">
            <option>All qualifications</option><option>Degree</option><option>Diploma</option><option>Certificate</option>
          </select>
          <select className="rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm">
            <option>Any APS</option><option>20+</option><option>26+</option><option>30+</option><option>36+</option>
          </select>
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Browse by faculty</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {faculties.map((f) => (
              <button key={f.name} className="rounded-2xl border border-border/60 bg-card p-5 text-left shadow-(--shadow-soft) transition-all hover:-translate-y-1 hover:shadow-(--shadow-card)">
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-bold">{f.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{f.count} programmes</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Featured programmes</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <article key={p.name} className="rounded-2xl border border-border/60 bg-card p-5 shadow-(--shadow-soft)">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">{p.type}</span>
                  <span className="text-xs text-muted-foreground">APS {p.aps}+</span>
                </div>
                <h3 className="mt-3 font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.uni}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span>{p.duration}</span>
                  <Link to="/register" className="font-semibold text-primary hover:underline">Apply →</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}