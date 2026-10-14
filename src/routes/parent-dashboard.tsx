import { createFileRoute, Link, type LinkProps } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ParentShell } from "@/components/ParentShell";
import {
  Users,
  FileText,
  CalendarDays,
  Bell,
  ArrowRight,
  User,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { PageHeader, StatCard, Panel, btn, type Tone } from "@/components/dashboard/ui";
import { StatCardsSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";

export const Route = createFileRoute("/parent-dashboard")({
  head: () => ({ meta: [{ title: "Parent Dashboard · Varsity Hub" }] }),
  component: ParentDashboard,
});

type ParentSummary = {
  children: number;
  applicationsInProgress: number;
  upcomingDeadlines: number;
  unread: number;
};

const quickLinks: {
  to: LinkProps["to"];
  label: string;
  hint: string;
  icon: typeof User;
  tone: Tone;
}[] = [
  {
    to: "/parent-student-profile",
    label: "Student Profile",
    hint: "Academic details",
    icon: User,
    tone: "emerald",
  },
  {
    to: "/parent-applications",
    label: "Applications",
    hint: "Track progress",
    icon: FileText,
    tone: "amber",
  },
  {
    to: "/parent-programmes",
    label: "Programme Choices",
    hint: "Interests & offers",
    icon: BookOpen,
    tone: "blue",
  },
  {
    to: "/parent-deadlines",
    label: "Deadlines",
    hint: "Upcoming dates",
    icon: CalendarDays,
    tone: "rose",
  },
];

function ParentDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["parent-summary"],
    queryFn: () => api.get<ParentSummary>("/api/parent/summary"),
  });

  return (
    <ParentShell>
      <PageHeader
        eyebrow="Parent / Guardian"
        title="Welcome back 👋"
        subtitle="Monitor your learner's university journey."
      />

      {isLoading && <StatCardsSkeleton />}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load your dashboard.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Users}
              tone="emerald"
              label="Linked Learners"
              value={data?.children ?? "—"}
              hint="On your account"
            />
            <StatCard
              icon={FileText}
              tone="amber"
              label="Applications In Progress"
              value={data?.applicationsInProgress ?? "—"}
              hint="Being processed"
            />
            <StatCard
              icon={CalendarDays}
              tone="rose"
              label="Upcoming Deadlines"
              value={data?.upcomingDeadlines ?? "—"}
              hint="Coming up"
            />
            <StatCard
              icon={Bell}
              tone="blue"
              label="Unread Notifications"
              value={data?.unread ?? "—"}
              hint="Need attention"
            />
          </div>

          <Panel className="mt-6" title="Quick Links" icon={ArrowRight} tone="emerald" flush>
            <ul className="divide-y divide-border/50">
              {quickLinks.map((q) => (
                <li key={q.to}>
                  <Link
                    to={q.to}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                      <q.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{q.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{q.hint}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <Lightbulb className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Quick tip</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Support your learner by ensuring all required documents are uploaded well before each
            university deadline.
          </p>
        </div>
      </div>

      <Link to="/parent-notifications" className={`mt-6 ${btn.outline}`}>
        <Bell className="h-4 w-4" /> View notifications
      </Link>
    </ParentShell>
  );
}
