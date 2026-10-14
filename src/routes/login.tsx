import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck, GraduationCap, FileBadge, Briefcase,
  UsersRound, User, Home, Users, Building2, Shield,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import heroImage from "@/assets/hero-books-cap.png";
import { useAuth, HOME_BY_ROLE, type Role } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login · Varsity Hub" }] }),
  component: Login,
});

const roles = [
  {
    id: "student",
    label: "Student",
    description: "Apply to universities",
    icon: GraduationCap,
    href: "/dashboard",
    color: "text-primary",
    activeBg: "bg-primary/5 border-primary ring-1 ring-primary/30",
  },
  {
    id: "parent",
    label: "Parent",
    description: "Monitor your child",
    icon: Home,
    href: "/parent-dashboard",
    color: "text-emerald-600",
    activeBg: "bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300",
  },
  {
    id: "counsellor",
    label: "Counsellor",
    description: "Guide learners",
    icon: Users,
    href: "/counsellor-dashboard",
    color: "text-indigo-600",
    activeBg: "bg-indigo-50 border-indigo-400 ring-1 ring-indigo-300",
  },
  {
    id: "uni-admin",
    label: "University",
    description: "Review applications",
    icon: Building2,
    href: "/uni-admin-dashboard",
    color: "text-blue-600",
    activeBg: "bg-blue-50 border-blue-400 ring-1 ring-blue-300",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Manage platform",
    icon: Shield,
    href: "/admin-dashboard",
    color: "text-purple-600",
    activeBg: "bg-purple-50 border-purple-400 ring-1 ring-purple-300",
  },
] as const;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await login(email, password);
      // The backend decides the role; route to that role's dashboard.
      const dest = (user.role && HOME_BY_ROLE[user.role as Role]) || "/dashboard";
      navigate({ to: dest as any });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Incorrect email or password."
          : err instanceof ApiError && err.status === 404
            ? "Login is not available yet — the backend needs a /api/Auth/login endpoint."
            : "Could not sign in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.012_250)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="rounded-2xl border border-border/60 bg-white p-8 shadow-(--shadow-card)">
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Log in to continue your journey. We&apos;ll take you to the right place.
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold">Email Address</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full rounded-lg border border-border/60 bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-border/60 bg-background py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                  {error}
                </p>
              )}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" /> Remember me
                </label>
                <a href="#" className="font-semibold text-primary">
                  Forgot Password?
                </a>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                or continue with
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-white py-2.5 text-sm font-medium hover:bg-muted/50"
                >
                  <span className="text-base font-bold text-[#4285F4]">G</span> Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-white py-2.5 text-sm font-medium hover:bg-muted/50"
                >
                  <span className="text-base font-bold text-[#00A4EF]">▦</span> Microsoft
                </button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-primary underline">
                  Register here
                </Link>
              </p>
            </form>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center">
            <div
              className="absolute inset-10 -z-10 rounded-full opacity-25 blur-3xl"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            />
            <div className="absolute inset-0 rounded-full border-2 border-[oklch(0.72_0.15_230/0.45)]" />
            <div className="absolute inset-6 rounded-full border border-dashed border-[oklch(0.72_0.15_230/0.55)]" />
            <div className="absolute inset-14 rounded-full border border-[oklch(0.72_0.15_230/0.35)]" />
            <FloatBadge className="left-2 top-[18%]">
              <GraduationCap className="h-6 w-6 text-brand-cyan" />
            </FloatBadge>
            <FloatBadge className="right-2 top-[28%]">
              <FileBadge className="h-6 w-6 text-brand-cyan" />
            </FloatBadge>
            <FloatBadge className="left-4 bottom-[28%]">
              <Briefcase className="h-6 w-6 text-brand-cyan" />
            </FloatBadge>
            <FloatBadge className="right-4 bottom-[18%]">
              <UsersRound className="h-6 w-6 text-primary" />
            </FloatBadge>
            <img src={heroImage} alt="" loading="lazy" className="relative z-10 w-[80%] object-contain" />

            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-2xl border border-border/60 bg-white px-5 py-3 shadow-(--shadow-card) w-72">
              <p className="text-center text-xs font-semibold text-muted-foreground mb-2">5 Portals · One Platform</p>
              <div className="flex justify-center gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <div key={role.id} className="flex flex-col items-center gap-1">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-muted/30`}>
                        <Icon className={`h-4 w-4 ${role.color}`} />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{role.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex items-center gap-4 rounded-2xl border border-[oklch(0.9_0.03_260)] bg-[oklch(0.96_0.025_260)] px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Your future, our priority.</h3>
            <p className="text-xs text-muted-foreground">
              Your data is secure with us. We use advanced security to protect your information.
            </p>
          </div>
          <div className="ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <Lock className="h-5 w-5 text-primary" />
          </div>
        </div>
      </main>
      <MinimalFooter />
    </div>
  );
}

function FloatBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`absolute z-20 flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-(--shadow-card) ring-1 ring-border ${className}`}
    >
      {children}
    </div>
  );
}

function MinimalFooter() {
  return (
    <footer className="mt-10 border-t border-border/40 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
        <span>© {new Date().getFullYear()} Varsity Hub. All rights reserved.</span>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-foreground">Privacy Policy</a>
          <a href="#" className="hover:text-foreground">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
