/* eslint-disable prettier/prettier */
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Client-side pagination for table data.
 *
 *   const { pageItems, ...pg } = usePagination(rows, 10);
 *   // render pageItems in the tbody
 *   <Pagination {...pg} />
 *
 * `page` is always clamped to a valid range, so it stays correct when the
 * underlying list shrinks (e.g. after a filter changes).
 */
export function usePagination<T>(items: T[], pageSize = 10) {
  const [rawPage, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, rawPage), totalPages);
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  return {
    pageItems,
    page,
    setPage,
    totalPages,
    total,
    pageSize,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
  };
}

function pageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const lo = Math.max(2, page - 1);
  const hi = Math.min(totalPages - 1, page + 1);
  if (lo > 2) out.push("…");
  for (let i = lo; i <= hi; i++) out.push(i);
  if (hi < totalPages - 1) out.push("…");
  out.push(totalPages);
  return out;
}

export function Pagination({
  page,
  totalPages,
  total,
  from,
  to,
  setPage,
  className,
  noun = "results",
}: {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  setPage: (p: number) => void;
  className?: string;
  noun?: string;
}) {
  if (total === 0) return null;

  const nav =
    "inline-flex h-9 items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40";
  const num =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium tabular-nums transition-colors";

  return (
    <div
      className={cn(
        "mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2 shadow-(--shadow-xs) sm:flex-row",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{from}</span>–
        <span className="font-semibold text-foreground">{to}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span> {noun}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button className={nav} onClick={() => setPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <div className="flex items-center gap-1">
            {pageWindow(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="grid h-9 w-6 place-items-center text-sm text-muted-foreground">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(
                    num,
                    p === page
                      ? "bg-primary text-primary-foreground shadow-(--shadow-xs)"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ),
            )}
          </div>

          <button className={nav} onClick={() => setPage(page + 1)} disabled={page >= totalPages} aria-label="Next page">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
