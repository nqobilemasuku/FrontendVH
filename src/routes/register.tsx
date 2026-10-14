import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  User,
  IdCard,
  Mail,
  Phone,
  Lock,
  Calendar as CalendarIcon,
  ChevronDown,
  MapPin,
  ShieldCheck,
  GraduationCap,
  FileBadge,
  Building2,
  UsersRound,
  Globe2,
  BookUser,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import heroImage from "@/assets/hero-student.png";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register · Varsity Hub" }] }),
  component: Register,
});

type StudentType = "sa" | "international";

// Exact fallback list required when the lookup endpoint errors or returns empty.
const FALLBACK_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

/**
 * Derive YYYY-MM-DD from the first 6 digits of a 13-digit SA ID number.
 * Century rule: if YY <= (currentYear % 100) treat as 2000s, else 1900s.
 * Returns null when the ID is not exactly 13 digits.
 */
function dobFromSaId(id: string): string | null {
  const digits = id.replace(/\D/g, "");
  if (digits.length !== 13) return null;
  const yy = parseInt(digits.slice(0, 2), 10);
  const mm = digits.slice(2, 4);
  const dd = digits.slice(4, 6);
  const currentYY = new Date().getFullYear() % 100;
  const century = yy <= currentYY ? 2000 : 1900;
  return `${century + yy}-${mm}-${dd}`;
}

/** Luhn checksum used by South African ID numbers (the 13th digit). */
function luhnValid(id: string): boolean {
  const d = id.replace(/\D/g, "");
  if (d.length !== 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = parseInt(d[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** Client-side SA ID validation mirroring the backend rules. */
function computeSaIdError(studentType: StudentType, idDigits: string, dateOfBirth: string): string | null {
  if (studentType !== "sa" || idDigits.length === 0) return null;
  if (idDigits.length !== 13) return "ID number must be 13 digits.";
  if (!luhnValid(idDigits)) return "That ID number isn't valid — please check it.";
  if (dateOfBirth && dobFromSaId(idDigits) !== dateOfBirth) return "ID number and date of birth don't match";
  return null;
}

function Field({
  label,
  type = "text",
  placeholder,
  icon: Icon,
  withEye,
  value,
  onChange,
  name,
  required,
}: {
  label: string;
  type?: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  withEye?: boolean;
  value?: string;
  onChange?: (v: string) => void;
  name?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  const inputType = withEye ? (show ? "text" : type) : type;
  return (
    <div>
      <label className="text-xs font-semibold text-foreground">{label}</label>
      <div className="relative mt-1">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type={inputType}
          name={name}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full rounded-lg border border-border/60 bg-background py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {withEye && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const [studentType, setStudentType] = useState<StudentType>("sa");

  // Controlled form state
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [province, setProvince] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [idNumberErrors, setIdNumberErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Provinces come from the backend lookup; fall back to the canonical list.
  const provincesQuery = useQuery({
    queryKey: ["lookups", "provinces"],
    queryFn: () => api.get<string[]>("/api/lookups/provinces"),
    retry: false,
  });
  const provinces =
    provincesQuery.data && provincesQuery.data.length > 0
      ? provincesQuery.data
      : FALLBACK_PROVINCES;

  const today = new Date().toISOString().slice(0, 10);

  // Live password rules
  const rules = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "One lowercase letter", ok: /[a-z]/.test(password) },
    { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "One number", ok: /[0-9]/.test(password) },
    { label: "One symbol", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const allRulesPass = rules.every((r) => r.ok);
  const passwordsMatch = password.length > 0 && password === confirm;

  // SA ID validation (13 digits, Luhn checksum, DOB match) — mirrors the backend.
  const idDigits = idNumber.replace(/\D/g, "");
  const saIdError = computeSaIdError(studentType, idDigits, dateOfBirth);

  const canSubmit = !busy && allRulesPass && passwordsMatch && !saIdError;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPasswordErrors([]);
    setIdNumberErrors([]);

    if (!allRulesPass) {
      setError("Please meet all password requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }
    if (saIdError) {
      setError(saIdError);
      return;
    }
    if (!dateOfBirth) {
      setError("Please enter your date of birth.");
      return;
    }
    if (studentType === "sa" && !province) {
      setError("Please select your province.");
      return;
    }

    const payload: Record<string, unknown> = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      studentType,
      dateOfBirth,
      channel: "email",
    };
    if (studentType === "sa") {
      payload.idNumber = idDigits;
      payload.province = province;
    } else {
      payload.passportNumber = passportNumber.trim();
    }
    if (gender) payload.gender = gender;

    setBusy(true);
    try {
      await api.post("/api/Auth/register", payload, { auth: false });
      // Registration no longer sends an OTP — the account is usable immediately.
      navigate({ to: "/register-success" });
    } catch (err) {
      // Defensively surface server-side field validation errors as red bullets.
      if (err instanceof ApiError && err.status === 400) {
        const body = err.body as
          | {
              errors?: { Password?: unknown; IdNumber?: unknown; idNumber?: unknown };
              Password?: unknown;
              IdNumber?: unknown;
            }
          | null
          | undefined;
        const pw = body?.errors?.Password ?? body?.Password;
        if (Array.isArray(pw)) setPasswordErrors(pw.map((m) => String(m)));
        const idErr = body?.errors?.IdNumber ?? body?.errors?.idNumber ?? body?.IdNumber;
        if (Array.isArray(idErr)) setIdNumberErrors(idErr.map((m) => String(m)));
      }
      setError(
        err instanceof ApiError && err.status === 404
          ? "Registration is not available yet — check the backend /api/Auth/register endpoint."
          : err instanceof ApiError
            ? err.message
            : "Could not create your account. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.012_250)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="rounded-2xl border border-border/60 bg-white p-8 shadow-(--shadow-card)">
            <>
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Join thousands of students and take the next step towards your future.
                </p>

                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    I am a
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: "sa" as const, label: "South African Student", icon: IdCard },
                        {
                          id: "international" as const,
                          label: "International Student",
                          icon: Globe2,
                        },
                      ] as const
                    ).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setStudentType(id)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition-all",
                          studentType === id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border/60 hover:bg-muted/50",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleRegister} className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Full Name"
                      name="fullName"
                      placeholder="Enter your full name"
                      icon={User}
                      value={fullName}
                      onChange={setFullName}
                      required
                    />
                    {studentType === "sa" ? (
                      <Field
                        label="ID Number"
                        name="idNumber"
                        placeholder="Enter your ID number"
                        icon={IdCard}
                        value={idNumber}
                        onChange={setIdNumber}
                        required
                      />
                    ) : (
                      <Field
                        label="Passport Number"
                        name="passportNumber"
                        placeholder="Enter passport number"
                        icon={BookUser}
                        value={passportNumber}
                        onChange={setPassportNumber}
                        required
                      />
                    )}
                  </div>
                  {saIdError && (
                    <p className="text-xs font-medium text-rose-600">{saIdError}</p>
                  )}
                  {idNumberErrors.length > 0 && (
                    <ul className="space-y-1">
                      {idNumberErrors.map((m, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs font-medium text-rose-600">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-600" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                  {studentType === "international" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold">Country of Origin</label>
                        <div className="relative mt-1">
                          <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <select className="w-full appearance-none rounded-lg border border-border/60 bg-background py-2.5 pl-9 pr-9 text-sm">
                            <option>Select country</option>
                            <option>Nigeria</option>
                            <option>Zimbabwe</option>
                            <option>Botswana</option>
                            <option>Other</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </div>
                      <Field
                        label="Study Permit (optional)"
                        placeholder="Permit number"
                        icon={FileBadge}
                      />
                    </div>
                  )}
                  <Field
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    icon={Mail}
                    value={email}
                    onChange={setEmail}
                    required
                  />
                  <Field
                    label="Phone Number"
                    name="phone"
                    placeholder="Enter your phone number"
                    icon={Phone}
                    value={phone}
                    onChange={setPhone}
                  />
                  <div>
                    <Field
                      label="Password"
                      name="password"
                      type="password"
                      placeholder="Create a password"
                      icon={Lock}
                      withEye
                      value={password}
                      onChange={setPassword}
                      required
                    />
                    <ul className="mt-2 space-y-1">
                      {rules.map((r) => (
                        <li
                          key={r.label}
                          className={cn(
                            "flex items-center gap-1.5 text-xs transition-colors",
                            r.ok ? "text-emerald-600" : "text-muted-foreground",
                          )}
                        >
                          <Check
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              r.ok ? "text-emerald-600" : "text-muted-foreground/40",
                            )}
                          />
                          {r.label}
                        </li>
                      ))}
                    </ul>
                    {passwordErrors.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {passwordErrors.map((m, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 text-xs font-medium text-rose-600"
                          >
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-600" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <Field
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      icon={Lock}
                      withEye
                      value={confirm}
                      onChange={setConfirm}
                      required
                    />
                    {confirm.length > 0 && confirm !== password && (
                      <p className="mt-1.5 text-xs font-medium text-rose-600">
                        Passwords do not match.
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold">Date of Birth</label>
                      <div className="relative mt-1">
                        <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="date"
                          required
                          max={today}
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className={cn(
                            "w-full rounded-lg border border-border/60 bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
                            !dateOfBirth && "text-muted-foreground",
                          )}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold">Gender</label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className={cn(
                            "w-full appearance-none rounded-lg border border-border/60 bg-background py-2.5 pl-9 pr-9 text-sm",
                            !gender && "text-muted-foreground",
                          )}
                        >
                          <option value="">Select your gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  {studentType === "sa" && (
                    <div>
                      <label className="text-xs font-semibold">Province</label>
                      <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <select
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          required
                          className={cn(
                            "w-full appearance-none rounded-lg border border-border/60 bg-background py-2.5 pl-9 pr-9 text-sm",
                            !province && "text-muted-foreground",
                          )}
                        >
                          <option value="">Select your province</option>
                          {provinces.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  <label className="flex items-start gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" className="mt-0.5" required />
                    <span>
                      I agree to the{" "}
                      <a className="font-semibold text-primary underline" href="#">
                        Terms & Conditions
                      </a>{" "}
                      and{" "}
                      <a className="font-semibold text-primary underline" href="#">
                        Privacy Policy
                      </a>
                    </span>
                  </label>

                  {error && (
                    <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {busy ? "Creating account…" : "Continue to verification"}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-primary underline">
                      Login here
                    </Link>
                  </p>
                </form>
              </>
          </div>

          <div className="sticky top-28 relative mx-auto hidden aspect-square w-full max-w-md items-center justify-center lg:flex">
            <div
              className="absolute inset-10 -z-10 rounded-full opacity-25 blur-3xl"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            />
            <div className="absolute inset-0 rounded-full border-2 border-[oklch(0.72_0.15_230/0.45)]" />
            <div className="absolute inset-6 rounded-full border border-dashed border-[oklch(0.72_0.15_230/0.55)]" />
            <FloatBadge className="left-2 top-[18%]">
              <Building2 className="h-6 w-6 text-primary" />
            </FloatBadge>
            <FloatBadge className="right-2 top-[30%]">
              <UsersRound className="h-6 w-6 text-brand-cyan" />
            </FloatBadge>
            <FloatBadge className="left-4 bottom-[30%]">
              <GraduationCap className="h-6 w-6 text-primary" />
            </FloatBadge>
            <FloatBadge className="right-4 bottom-[18%]">
              <FileBadge className="h-6 w-6 text-brand-cyan" />
            </FloatBadge>
            <img src={heroImage} alt="" loading="lazy" className="relative z-10 w-[82%] object-contain" />
          </div>
        </div>

        <div className="mt-12 flex items-center gap-4 rounded-2xl border border-[oklch(0.9_0.03_260)] bg-[oklch(0.96_0.025_260)] px-6 py-5">
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
          <a href="#" className="hover:text-foreground">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-foreground">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
