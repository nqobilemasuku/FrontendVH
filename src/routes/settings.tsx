/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ComponentType, ReactNode } from "react";
import { StudentShell } from "@/components/StudentShell";
import { Bell, Lock, Globe, Eye, Trash2, Settings as SettingsIcon, Sun, Loader2, Save } from "lucide-react";
import { PageHeader, Panel, IconBadge, btn, type Tone } from "@/components/dashboard/ui";
import { PanelSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Varsity Hub" }] }),
  component: Settings,
});

type UserSettingsDto = {
  notificationPrefs: string | null;
  theme: string | null;
  locale: string | null;
};
type UpdateSettings = {
  notificationPrefs: string;
  theme: string;
  locale: string;
};
// Shape of the parsed notificationPrefs JSON string (guessed — see report).
type NotifPrefs = { email: boolean; sms: boolean; push: boolean; marketing: boolean };

const defaultPrefs: NotifPrefs = { email: true, sms: false, push: true, marketing: false };

const nav: { id: string; label: string; icon: ComponentType<{ className?: string }>; tone: Tone }[] = [
  { id: "notifications", label: "Notifications", icon: Bell, tone: "primary" },
  { id: "appearance", label: "Appearance & Language", icon: Globe, tone: "violet" },
  { id: "security", label: "Security", icon: Lock, tone: "blue" },
  { id: "privacy", label: "Privacy", icon: Eye, tone: "teal" },
  { id: "danger", label: "Delete account", icon: Trash2, tone: "rose" },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        on ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          on ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/50 py-3.5 first:border-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const selectCls =
  "rounded-lg border border-border/70 bg-card py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25";

function parsePrefs(raw: string | null | undefined): NotifPrefs {
  if (!raw) return defaultPrefs;
  try {
    return { ...defaultPrefs, ...(JSON.parse(raw) as Partial<NotifPrefs>) };
  } catch {
    return defaultPrefs;
  }
}

function Settings() {
  const qc = useQueryClient();
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
  const [theme, setTheme] = useState("light");
  const [locale, setLocale] = useState("en-ZA");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["me", "settings"],
    queryFn: () => api.get<UserSettingsDto>("/api/me/settings"),
  });

  useEffect(() => {
    if (data) {
      setPrefs(parsePrefs(data.notificationPrefs));
      setTheme(data.theme ?? "light");
      setLocale(data.locale ?? "en-ZA");
    }
  }, [data]);

  const save = useMutation({
    mutationFn: (body: UpdateSettings) => api.patch<UserSettingsDto>("/api/me/settings", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me", "settings"] }),
  });

  function commit() {
    save.mutate({ notificationPrefs: JSON.stringify(prefs), theme, locale });
  }
  function toggle(key: keyof NotifPrefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  return (
    <StudentShell>
      <PageHeader
        icon={SettingsIcon}
        eyebrow="Account"
        title="Settings"
        subtitle="Manage account preferences and privacy."
        actions={
          <button className={btn.primary} onClick={commit} disabled={save.isPending || isLoading}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
          </button>
        }
      />

      {isLoading && <PanelSkeleton />}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load your settings.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* Settings nav */}
          <nav className="lg:sticky lg:top-24 lg:self-start">
            <ul className="flex flex-wrap gap-1.5 lg:flex-col">
              {nav.map((n, i) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <n.icon className="h-4 w-4 shrink-0" />
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Settings content */}
          <div className="space-y-6">
            {save.isError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Couldn't save your settings. Please try again.
              </div>
            )}

            <div id="notifications" className="scroll-mt-24">
              <Panel icon={Bell} tone="primary" title="Notifications" description="Choose how you want to be notified.">
                <Row label="Email notifications" hint="Application updates & messages">
                  <Toggle on={prefs.email} onChange={() => toggle("email")} />
                </Row>
                <Row label="SMS notifications" hint="Critical deadlines only">
                  <Toggle on={prefs.sms} onChange={() => toggle("sms")} />
                </Row>
                <Row label="Push notifications" hint="Real time in app alerts">
                  <Toggle on={prefs.push} onChange={() => toggle("push")} />
                </Row>
                <Row label="Marketing emails" hint="Tips, news and promotions">
                  <Toggle on={prefs.marketing} onChange={() => toggle("marketing")} />
                </Row>
              </Panel>
            </div>

            <div id="appearance" className="scroll-mt-24">
              <Panel icon={Sun} tone="violet" title="Appearance & Language" description="Display preferences.">
                <Row label="Theme" hint="How Varsity Hub looks">
                  <select className={selectCls} value={theme} onChange={(e) => setTheme(e.target.value)}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </Row>
                <Row label="Language & region" hint="Interface language and formats">
                  <select className={selectCls} value={locale} onChange={(e) => setLocale(e.target.value)}>
                    <option value="en-ZA">English (South Africa)</option>
                    <option value="zu-ZA">IsiZulu</option>
                    <option value="af-ZA">Afrikaans</option>
                    <option value="st-ZA">Sesotho</option>
                  </select>
                </Row>
              </Panel>
            </div>

            <div id="security" className="scroll-mt-24">
              <Panel icon={Lock} tone="blue" title="Security" description="Protect your account.">
                <Row label="Change password" hint="Keep your account secure">
                  <button className={btn.outline}>Update</button>
                </Row>
                <Row label="Active sessions" hint="Devices logged in">
                  <button className={btn.outline}>Manage</button>
                </Row>
              </Panel>
            </div>

            <div id="privacy" className="scroll-mt-24">
              <Panel icon={Eye} tone="teal" title="Privacy" description="Control what others can see.">
                <Row label="Download my data" hint="Get a copy of your information">
                  <button className={btn.outline}>Download</button>
                </Row>
              </Panel>
            </div>

            <div id="danger" className="scroll-mt-24">
              <section className="rounded-2xl border border-rose-200 bg-rose-50/50 shadow-(--shadow-card)">
                <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <IconBadge icon={Trash2} tone="rose" size="lg" />
                    <div>
                      <h3 className="font-semibold text-rose-700">Delete account</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Permanently remove your account and all related data. This cannot be undone.
                      </p>
                    </div>
                  </div>
                  <button className={cn(btn.destructive, "shrink-0")}>Delete account</button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </StudentShell>
  );
}
