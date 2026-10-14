/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentShell } from "@/components/StudentShell";
import {
  Upload,
  FileText,
  File as FileIcon,
  Download,
  FolderOpen,
  ShieldCheck,
  Clock3,
  Layers,
  Loader2,
  Trash2,
  X,
  Check,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  Panel,
  StatusPill,
  IconBadge,
  table,
  btn,
} from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePagination, Pagination } from "@/components/dashboard/pagination";
import {
  DOCUMENT_TYPES,
  documentTypeLabels,
  inferDocumentType,
  uploadDocument,
  type DocumentDetail,
  type DocumentType,
} from "@/lib/documents";

export const Route = createFileRoute("/documents")({
  head: () => ({ meta: [{ title: "Documents · Varsity Hub" }] }),
  component: Documents,
});

const typeLabels = documentTypeLabels;

function typeIcon(type: string) {
  if (type === "id" || type === "passport" || type === "study_permit") return FileIcon;
  return FileText;
}
function formatSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Documents() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<DocumentDetail | null>(null);
  // A picked file awaiting a type choice before upload.
  const [pending, setPending] = useState<{ file: File; type: DocumentType } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.get<DocumentDetail[]>("/api/Documents"),
  });

  const upload = useMutation({
    mutationFn: ({ file, type }: { file: File; type: DocumentType }) => uploadDocument(file, type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      setPending(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/api/Documents/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      setConfirmDelete(null);
    },
  });

  const docs = data ?? [];
  const totalBytes = docs.reduce((a, d) => a + (d.sizeBytes || 0), 0);
  const types = new Set(docs.map((d) => d.type)).size;
  const latest = docs.length
    ? new Date(Math.max(...docs.map((d) => new Date(d.createdAt).getTime())))
    : null;
  const { pageItems, page, setPage, totalPages, total, from, to } = usePagination(docs, 10);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPending({ file, type: inferDocumentType(file.name) });
    e.target.value = "";
  }

  return (
    <StudentShell>
      <input ref={fileRef} type="file" className="hidden" onChange={onFile} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />

      <PageHeader
        icon={FolderOpen}
        eyebrow="Applications"
        title="Documents"
        subtitle="Upload and manage your application documents."
        actions={
          <button className={btn.primary} onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload Document
          </button>
        }
      />

      {upload.isError && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Couldn't upload your document. Please try again.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FolderOpen} tone="primary" label="Total Documents" value={docs.length} hint="Uploaded to your profile" />
        <StatCard icon={Layers} tone="indigo" label="Document Types" value={types} hint="Distinct categories" />
        <StatCard icon={ShieldCheck} tone="emerald" label="Total Size" value={formatSize(totalBytes)} hint="Across all files" />
        <StatCard
          icon={Clock3}
          tone="amber"
          label="Last Upload"
          value={latest ? latest.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" }) : "—"}
          hint="Most recent activity"
        />
      </div>

      {/* Dropzone */}
      <button
        onClick={() => fileRef.current?.click()}
        className="mt-6 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center shadow-(--shadow-card) transition-colors hover:border-primary/50 hover:bg-primary/5"
      >
        <IconBadge icon={Upload} tone="primary" size="lg" />
        <p className="mt-3 text-sm font-semibold">Click to browse and upload a document</p>
        <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 5 MB</p>
      </button>

      {isLoading && <TableSkeleton className="mt-6" />}
      {isError && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load your documents.
        </div>
      )}

      {!isLoading && !isError && (
        <Panel className="mt-6" flush icon={FileText} title="Uploaded Documents" description={`${docs.length} files`}>
          <div className="overflow-x-auto">
            <table className={table.el}>
              <thead className={table.thead}>
                <tr>
                  <th className={table.th}>Name</th>
                  <th className={table.th}>Type</th>
                  <th className={table.th}>Size</th>
                  <th className={table.th}>Date</th>
                  <th className={cn(table.th, "text-right")} />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((d) => {
                  const Icon = typeIcon(d.type);
                  return (
                    <tr key={d.id} className={table.row}>
                      <td className={table.td}>
                        <div className="flex items-center gap-2.5">
                          <IconBadge icon={Icon} tone="primary" size="sm" />
                          <span className="font-medium">{d.name}</span>
                        </div>
                      </td>
                      <td className={table.td}>
                        <StatusPill tone="indigo" dot={false}>{typeLabels[d.type as DocumentType] ?? d.type}</StatusPill>
                      </td>
                      <td className={cn(table.td, "tabular-nums text-muted-foreground")}>{formatSize(d.sizeBytes)}</td>
                      <td className={cn(table.td, "text-muted-foreground")}>
                        {new Date(d.createdAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className={cn(table.td, "text-right")}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label="Download"
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            aria-label="Delete"
                            title="Delete"
                            onClick={() => setConfirmDelete(d)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {docs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-sm text-muted-foreground">
                      No documents uploaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} setPage={setPage} noun="documents" />
        </Panel>
      )}

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !upload.isPending && setPending(null)}>
          <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPending(null)}
              disabled={upload.isPending}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <IconBadge icon={FileText} tone="primary" />
              <div className="min-w-0">
                <h2 className="text-base font-bold">Upload document</h2>
                <p className="truncate text-xs text-muted-foreground">{pending.file.name} · {formatSize(pending.file.size)}</p>
              </div>
            </div>
            <label className="mt-5 mb-1.5 block text-xs font-medium text-muted-foreground">Document type</label>
            <select
              value={pending.type}
              onChange={(e) => setPending((p) => (p ? { ...p, type: e.target.value as DocumentType } : p))}
              className="w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{typeLabels[t]}</option>
              ))}
            </select>
            {upload.isError && (
              <p className="mt-3 text-sm text-rose-600">Couldn&apos;t upload your document. Please try again.</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button className={btn.outline} disabled={upload.isPending} onClick={() => setPending(null)}>Cancel</button>
              <button
                className={btn.primary}
                disabled={upload.isPending}
                onClick={() => upload.mutate({ file: pending.file, type: pending.type })}
              >
                {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="relative w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setConfirmDelete(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <Trash2 className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold">Delete document?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Delete <span className="font-semibold text-foreground">{confirmDelete.name}</span>? This action can't be undone.
            </p>
            {remove.isError && (
              <p className="mt-3 text-sm text-rose-600">Couldn't delete the document. Please try again.</p>
            )}
            <div className="mt-6 flex justify-center gap-2">
              <button className={btn.outline} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className={cn(btn.primary, "bg-rose-600 hover:bg-rose-700")}
                disabled={remove.isPending}
                onClick={() => remove.mutate(confirmDelete.id)}
              >
                {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentShell>
  );
}
