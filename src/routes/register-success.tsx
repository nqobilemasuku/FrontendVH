import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  LayoutDashboard,
  UserCircle,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/register-success")({
  head: () => ({ meta: [{ title: "Welcome to Varsity Hub" }] }),
  component: RegisterSuccess,
});

const nextSteps = [
  {
    icon: UserCircle,
    title: "Complete your profile",
    desc: "Add your personal details so universities can get to know you.",
    to: "/profile",
  },
  {
    icon: GraduationCap,
    title: "Capture your final marks",
    desc: "Enter your results and we'll calculate your APS automatically.",
    to: "/academic-results",
  },
  {
    icon: Sparkles,
    title: "Explore programmes",
    desc: "Find qualifications and universities that match your goals.",
    to: "/programme-search",
  },
];

function RegisterSuccess() {
  return (
    <div className="min-h-screen bg-[oklch(0.985_0.012_250)]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
          <span className="absolute inset-2 rounded-full bg-emerald-100" />
          <CheckCircle2 className="relative h-14 w-14 text-emerald-600" />
        </div>

        <h1 className="mt-8 text-3xl font-extrabold tracking-tight sm:text-4xl">
          You&apos;re all set! 🎉
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
          Your account has been created successfully. Sign in to continue — welcome to Varsity Hub,
          your future, all in one place.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 font-semibold text-primary-foreground shadow-(--shadow-card) transition-all hover:-translate-y-0.5 hover:bg-primary/90"
          >
            <LayoutDashboard className="h-4 w-4" /> Go to my dashboard
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-7 py-3.5 font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            Sign in instead
          </Link>
        </div>

        <div className="mt-12 text-left">
          <p className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recommended next steps
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {nextSteps.map((s) => (
              <Link
                key={s.title}
                to={s.to as string}
                className="group rounded-2xl border border-border/60 bg-white p-5 text-left shadow-(--shadow-soft) transition-all hover:-translate-y-1 hover:shadow-(--shadow-card)"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                <ArrowRight className="mt-3 h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
