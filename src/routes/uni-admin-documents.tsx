import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UniversityAdminShell } from "@/components/UniversityAdminShell";
import { FolderOpen, FileCheck2, Clock, Files, Check } from "lucide-react";
import { PageHeader, StatCard, Panel, StatusPill, type Tone } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import { api } from "@/lib/api";

export const Route = createFileRoute("/uni-admin-documents")({
  head: () => ({ meta: [{ title: "Document Management · Varsity Hub" }] }),
  component: UniAdminDocuments,
});

type UniDocItem = {
  id: string;
  applicationId: string;
  name: string;
  type: string;
  storagePath: string;
  isVerified: boolean;
};

function typeLabel(t: string) {
  return t ? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";
}

const filterTabs = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "verified", label: "Verified" },
];

function UniAdminDocuments() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("all");
  const [applicationId, setApplicationId] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["uni-admin", "documents", applicationId],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (applicationId) qs.set("applicationId", applicationId);
      return api.get<UniDocItem[]>(`/api/uni-admin/documents?${qs.toString()}`);
    },
  });
  const docs = data ?? [];

  const verify = useMutation({
    mutationFn: (id: string) => api.patch(`/api/uni-admin/documents/${id}/verify`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["uni-admin", "documents"] }),
  });

  const filtered = useMemo(() => {
    if (tab === "verified") return docs.filter((d) => d.isVerified);
    if (tab === "pending") return docs.filter((d) => !d.isVerified);
    return docs;
  }, [docs, tab]);

  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(filtered, 10);

  const stats: { icon: typeof Files; label: string; value: number; tone: Tone }[] = [
    { icon: Files, label: "Total Documents", value: docs.length, tone: "blue" },
    { icon: FileCheck2, label: "Verified", value: docs.filter((d) => d.isVerified).length, tone: "emerald" },
    { icon: Clock, label: "Pending", value: docs.filter((d) => !d.isVerified).length, tone: "amber" },
  ];

  return (
    <UniversityAdminShell>
      <PageHeader
        eyebrow="Admissions"
        title="Document Management"
        subtitle="Verify and manage submitted student documents."
        icon={FolderOpen}
        tone="blue"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Filter pills */}
      <div className="mt-6 inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl bg-muted/40 p-1">
        {filterTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id ? "bg-card text-foreground shadow-(--shadow-xs)" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Optional application filter */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={applicationId}
          onChange={(e) => setApplicationId(e.target.value)}
          placeholder="Filter by Application ID (optional)…"
          className="min-w-48 flex-1 rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) transition-shadow placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/25"
        />
      </div>

      <Panel className="mt-4" flush>
        {isLoading && <TableSkeleton />}
        {isError && (
          <div className="px-5 py-16 text-center text-sm text-rose-600">Couldn't load documents.</div>
        )}
        {!isLoading && !isError && (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Document</th>
                  <th className="px-5 py-3 text-left font-semibold">Type</th>
                  <th className="px-5 py-3 text-left font-semibold">Application</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((doc) => (
                  <tr key={doc.id} className="border-t border-border/50 transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3.5 font-medium text-foreground">{doc.name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{typeLabel(doc.type)}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-muted-foreground">{doc.applicationId}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill tone={doc.isVerified ? "emerald" : "amber"}>
                        {doc.isVerified ? "Verified" : "Pending"}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                        {!doc.isVerified && (
                          <button
                            onClick={() => verify.mutate(doc.id)}
                            disabled={verify.isPending}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-sm text-muted-foreground">
                      No documents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {total > 0 && (
            <div className="px-5 pb-5">
              <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} setPage={setPage} noun="documents" />
            </div>
          )}
          </>
        )}
      </Panel>
    </UniversityAdminShell>
  );
}
