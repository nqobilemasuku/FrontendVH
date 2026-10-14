/* eslint-disable prettier/prettier */
import type { ComponentType, ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Premium Light design kit
 * Shared primitives used across every Varsity Hub dashboard & portal page.
 * ------------------------------------------------------------------ */

type IconType = ComponentType<{ className?: string }>;

export type Tone =
  | "primary"
  | "violet"
  | "fuchsia"
  | "emerald"
  | "teal"
  | "blue"
  | "sky"
  | "cyan"
  | "indigo"
  | "amber"
  | "orange"
  | "rose"
  | "slate";

const toneStyles: Record<Tone, { soft: string; text: string; bar: string; ring: string }> = {
  primary: {
    soft: "bg-primary/10",
    text: "text-primary",
    bar: "bg-primary",
    ring: "ring-primary/15",
  },
  violet: {
    soft: "bg-violet-50",
    text: "text-violet-600",
    bar: "bg-violet-500",
    ring: "ring-violet-100",
  },
  fuchsia: {
    soft: "bg-fuchsia-50",
    text: "text-fuchsia-600",
    bar: "bg-fuchsia-500",
    ring: "ring-fuchsia-100",
  },
  emerald: {
    soft: "bg-emerald-50",
    text: "text-emerald-600",
    bar: "bg-emerald-500",
    ring: "ring-emerald-100",
  },
  teal: { soft: "bg-teal-50", text: "text-teal-600", bar: "bg-teal-500", ring: "ring-teal-100" },
  blue: { soft: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-500", ring: "ring-blue-100" },
  sky: { soft: "bg-sky-50", text: "text-sky-600", bar: "bg-sky-500", ring: "ring-sky-100" },
  cyan: { soft: "bg-cyan-50", text: "text-cyan-600", bar: "bg-cyan-500", ring: "ring-cyan-100" },
  indigo: {
    soft: "bg-indigo-50",
    text: "text-indigo-600",
    bar: "bg-indigo-500",
    ring: "ring-indigo-100",
  },
  amber: {
    soft: "bg-amber-50",
    text: "text-amber-600",
    bar: "bg-amber-500",
    ring: "ring-amber-100",
  },
  orange: {
    soft: "bg-orange-50",
    text: "text-orange-600",
    bar: "bg-orange-500",
    ring: "ring-orange-100",
  },
  rose: { soft: "bg-rose-50", text: "text-rose-600", bar: "bg-rose-500", ring: "ring-rose-100" },
  slate: {
    soft: "bg-slate-100",
    text: "text-slate-600",
    bar: "bg-slate-500",
    ring: "ring-slate-200",
  },
};

export function toneClasses(tone: Tone) {
  return toneStyles[tone];
}

/* -- Shared class maps (so raw markup stays consistent everywhere) --- */

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-(--shadow-soft) transition-all hover:bg-primary/90 hover:shadow-(--shadow-card) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  soft: "inline-flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
  destructive:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-600/90",
};

export const table = {
  wrap: "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-(--shadow-card)",
  el: "w-full text-sm",
  thead: "bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground",
  th: "px-5 py-3 text-left font-semibold whitespace-nowrap",
  row: "border-t border-border/50 transition-colors hover:bg-muted/30",
  td: "px-5 py-3.5 align-middle",
};

/* ------------------------------ Panel ----------------------------- */

export function Panel({
  title,
  description,
  action,
  icon,
  tone = "primary",
  children,
  className,
  bodyClassName,
  flush,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: IconType;
  tone?: Tone;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}) {
  const hasHeader = title || action || icon;
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/70 bg-card shadow-(--shadow-card)",
        className,
      )}
    >
      {hasHeader && (
        <header className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {icon && <IconBadge icon={icon} tone={tone} size="sm" />}
            <div className="min-w-0">
              {title && <h3 className="truncate font-semibold leading-tight">{title}</h3>}
              {description && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cn(!flush && "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/* --------------------------- IconBadge ---------------------------- */

export function IconBadge({
  icon: Icon,
  tone = "primary",
  size = "md",
  className,
}: {
  icon: IconType;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box =
    size === "sm"
      ? "h-8 w-8 rounded-lg"
      : size === "lg"
        ? "h-12 w-12 rounded-2xl"
        : "h-10 w-10 rounded-xl";
  const ic = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const t = toneStyles[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center ring-1",
        box,
        t.soft,
        t.text,
        t.ring,
        className,
      )}
    >
      <Icon className={ic} />
    </span>
  );
}

/* ---------------------------- TrendChip --------------------------- */

export function TrendChip({ dir, value }: { dir: "up" | "down" | "flat"; value: string }) {
  const Icon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus;
  const cls =
    dir === "up"
      ? "bg-emerald-50 text-emerald-700"
      : dir === "down"
        ? "bg-rose-50 text-rose-700"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        cls,
      )}
    >
      <Icon className="h-3 w-3" />
      {value}
    </span>
  );
}

/* ---------------------------- StatCard ---------------------------- */

export function StatCard({
  icon,
  label,
  value,
  hint,
  trend,
  tone = "primary",
  className,
}: {
  icon: IconType;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: { dir: "up" | "down" | "flat"; value: string };
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group rounded-2xl border border-border/70 bg-card p-5 shadow-(--shadow-card) transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-md)",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <IconBadge icon={icon} tone={tone} />
        {trend && <TrendChip {...trend} />}
      </div>
      <div className="mt-4 wrap-break-word text-3xl font-bold leading-tight tracking-tight tabular-nums text-foreground">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground/70">{hint}</div>}
    </div>
  );
}

/* --------------------------- PageHeader --------------------------- */

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
  icon,
  tone = "primary",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  icon?: IconType;
  tone?: Tone;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {icon && <IconBadge icon={icon} tone={tone} size="lg" />}
        <div>
          {eyebrow && (
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* --------------------------- StatusPill --------------------------- */

export function StatusPill({
  children,
  tone = "slate",
  dot = true,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  const t = toneStyles[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        t.soft,
        t.text,
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", t.bar)} />}
      {children}
    </span>
  );
}

/* --------------------------- ProgressBar -------------------------- */

export function ProgressBar({
  value,
  tone = "primary",
  className,
  trackClassName,
}: {
  value: number;
  tone?: Tone;
  className?: string;
  trackClassName?: string;
}) {
  const t = toneStyles[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", trackClassName)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", t.bar, className)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ----------------------------- BarRow ----------------------------- */

export function BarRow({
  label,
  value,
  max,
  tone = "primary",
  valueLabel,
  labelWidth = "w-32",
}: {
  label: ReactNode;
  value: number;
  max: number;
  tone?: Tone;
  valueLabel?: ReactNode;
  labelWidth?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={cn("shrink-0 truncate text-sm text-muted-foreground", labelWidth)}>
        {label}
      </span>
      <div className="flex-1">
        <ProgressBar value={pct} tone={tone} />
      </div>
      <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums">
        {valueLabel ?? value}
      </span>
    </div>
  );
}

/* --------------------------- SearchInput -------------------------- */

export function SearchInput({
  placeholder = "Search…",
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg border border-border/70 bg-card py-2.5 pl-9 pr-3 text-sm shadow-(--shadow-xs) transition-shadow placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
      />
    </div>
  );
}

/* --------------------------- Segmented ---------------------------- */

export function Segmented({
  options,
  active,
  className,
}: {
  options: string[];
  active: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1",
        className,
      )}
    >
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            i === active
              ? "bg-card text-foreground shadow-(--shadow-xs)"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
