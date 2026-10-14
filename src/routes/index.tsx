/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  Shield,
  FileSearch,
  Users,
  ClipboardCheck,
  ArrowRight,
  GraduationCap,
  FileBadge,
  Briefcase,
  UsersRound,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import heroImage from "@/assets/hero-student.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Varsity Hub · Your Future. All in One Place." },
      {
        name: "description",
        content:
          "Discover programs, check eligibility, get career guidance and apply to South African universities all in one place.",
      },
      { property: "og:title", content: "Varsity Hub · Your Future. All in One Place." },
      {
        property: "og:description",
        content: "Apply to multiple SA universities from one student profile.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: Shield,
    title: "Check Eligibility",
    desc: "Calculate your APS and see which programs you qualify for.",
    tint: "bg-accent text-primary",
  },
  {
    icon: FileSearch,
    title: "Find Programs",
    desc: "Explore thousands of university programs across SA.",
    tint: "bg-[oklch(0.95_0.05_230)] text-[oklch(0.5_0.18_240)]",
  },
  {
    icon: Users,
    title: "Career Guidance",
    desc: "Discover career paths that match your interests and strengths.",
    tint: "bg-accent text-primary",
  },
  {
    icon: ClipboardCheck,
    title: "Apply Easily",
    desc: "Submit applications to multiple universities in one place.",
    tint: "bg-[oklch(0.95_0.05_230)] text-[oklch(0.5_0.18_240)]",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="relative overflow-hidden">
        {/* soft gradient bg */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,oklch(0.95_0.05_295/0.4),transparent_60%)]" />

        {/* bottom-right gradient swoosh ribbon · matches design ref */}
        <svg
          aria-hidden
          viewBox="0 0 600 200"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -bottom-6 right-0 z-0 h-[260px] w-[62%]"
        >
          <defs>
            <linearGradient id="swoosh" x1="0" x2="1" y1="0.5" y2="0.5">
              <stop offset="0%" stopColor="oklch(0.62 0.22 300)" />
              <stop offset="55%" stopColor="oklch(0.55 0.22 270)" />
              <stop offset="100%" stopColor="oklch(0.62 0.18 235)" />
            </linearGradient>
          </defs>
          <path d="M0,200 C150,40 400,10 600,90 L600,200 Z" fill="url(#swoosh)" />
        </svg>

        <section className="grid w-full items-center gap-8 px-6 pt-10 pb-6 lg:grid-cols-2 lg:pt-14 lg:pb-8">
          <div>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Your Future.
              <br />
              All in{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-brand)" }}
              >
                One
              </span>{" "}
              Place.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground/70">
              Discover programs, check your eligibility, get career guidance and apply to South
              African universities.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="rounded-xl bg-primary px-7 py-3.5 font-semibold text-primary-foreground shadow-(--shadow-card) transition-all hover:translate-y-[-2px] hover:bg-primary/90"
              >
                Get Started
              </Link>
              <Link
                to="/about"
                className="rounded-xl border-2 border-primary px-7 py-3.5 font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-xl items-center justify-center">
            {/* gradient glow */}
            <div
              className="absolute inset-10 -z-10 rounded-full opacity-30 blur-3xl"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            />
            {/* concentric rings · tech orbit */}
            <div className="absolute inset-0 rounded-full border-2 border-[oklch(0.72_0.15_230/0.45)]" />
            <div className="absolute inset-6 rounded-full border border-dashed border-[oklch(0.72_0.15_230/0.55)]" />
            <div className="absolute inset-14 rounded-full border border-[oklch(0.72_0.15_230/0.35)]" />
            <div className="absolute inset-24 rounded-full border border-dashed border-[oklch(0.55_0.22_295/0.3)]" />
            {/* orbit dots */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div
                key={deg}
                className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-cyan"
                style={{ transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-46%)` }}
              />
            ))}

            {/* floating icon badges */}
            <FloatBadge className="left-2 top-[18%]" color="text-brand-cyan">
              <GraduationCap className="h-7 w-7" />
            </FloatBadge>
            <FloatBadge className="right-2 top-[28%]" color="text-brand-cyan">
              <FileBadge className="h-7 w-7" />
            </FloatBadge>
            <FloatBadge className="left-4 bottom-[28%]" color="text-brand-cyan">
              <Briefcase className="h-7 w-7" />
            </FloatBadge>
            <FloatBadge className="right-4 bottom-[18%]" color="text-primary">
              <UsersRound className="h-7 w-7" />
            </FloatBadge>

            <img
              src={heroImage}
              alt="Student using Varsity Hub on a smartphone"
              width={1024}
              height={1024}
              loading="eager"
              fetchPriority="high"
              className="relative z-10 w-[88%] object-contain"
            />
          </div>
        </section>

        <section className="relative z-10 w-full px-6 pb-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border/60 bg-card p-6 shadow-(--shadow-soft) transition-all hover:-translate-y-1 hover:shadow-(--shadow-card)"
              >
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.tint}`}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                <ArrowRight className="mt-4 h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FloatBadge({
  children,
  className,
  color,
}: {
  children: React.ReactNode;
  className?: string;
  color: string;
}) {
  return (
    <div
      className={`absolute z-20 flex h-14 w-14 items-center justify-center rounded-full bg-card shadow-(--shadow-card) ring-1 ring-border ${color} ${className}`}
    >
      {children}
    </div>
  );
}
