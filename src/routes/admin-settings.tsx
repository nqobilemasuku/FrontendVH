import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminShell } from "@/components/SuperAdminShell";
import { Settings, Save, Check, Loader2 } from "lucide-react";
import { PageHeader, Panel, btn } from "@/components/dashboard/ui";
import { PanelSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-settings")({
  head: () => ({ meta: [{ title: "System Settings · Varsity Hub" }] }),
  component: AdminSettings,
});

type SettingDto = { key: string; value: string };

function humanize(key: string) {
  return key
    .replace(/[_.-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function prettyJson(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

const inputCls =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 font-mono text-xs shadow-(--shadow-xs) placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25";

function SettingRow({ setting }: { setting: SettingDto }) {
  const qc = useQueryClient();
  const [value, setValue] = useState(prettyJson(setting.value));

  const saveMut = useMutation({
    mutationFn: () => api.put(`/api/admin/settings/${setting.key}`, { value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-settings"] }),
  });

  const dirty = value !== prettyJson(setting.value);

  return (
    <div className="grid gap-2 border-b border-border/50 py-4 last:border-0 sm:grid-cols-[16rem_1fr] sm:gap-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{humanize(setting.key)}</div>
        <div className="mt-0.5 wrap-break-word font-mono text-[11px] text-muted-foreground">
          {setting.key}
        </div>
      </div>
      <div>
        <textarea
          rows={Math.min(10, Math.max(2, value.split("\n").length))}
          className={cn(inputCls, "resize-y")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            className={cn(btn.primary, "px-3 py-1.5 text-xs")}
            disabled={saveMut.isPending || !dirty}
            onClick={() => saveMut.mutate()}
          >
            {saveMut.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save
          </button>
          {saveMut.isSuccess && !dirty && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          {saveMut.isError && <span className="text-xs text-rose-600">Couldn't save.</span>}
        </div>
      </div>
    </div>
  );
}

function AdminSettings() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.get<SettingDto[]>("/api/admin/settings"),
  });
  const settings = data ?? [];

  return (
    <SuperAdminShell>
      <PageHeader
        eyebrow="National Administration"
        title="System Settings"
        subtitle="Configure platform wide settings."
        icon={Settings}
        tone="fuchsia"
      />

      <Panel title="Settings" icon={Settings} tone="fuchsia">
        {isLoading && <PanelSkeleton />}
        {isError && (
          <div className="py-12 text-center text-sm text-rose-600">Couldn't load settings.</div>
        )}
        {!isLoading && !isError && (
          <>
            {settings.map((s) => (
              <SettingRow key={s.key} setting={s} />
            ))}
            {settings.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No settings configured.
              </div>
            )}
          </>
        )}
      </Panel>
    </SuperAdminShell>
  );
}
