/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Home, Search, MapPin, ShieldCheck, Heart, Star, BedDouble,
  Wifi, Bus, Utensils, Sparkles, Tag, X, Loader2,
} from "lucide-react";
import { StudentShell } from "@/components/StudentShell";
import { PageHeader, StatCard, Panel, StatusPill, btn } from "@/components/dashboard/ui";
import { CardGridSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/accommodation")({
  head: () => ({ meta: [{ title: "Accommodation Hub · Varsity Hub" }] }),
  component: Accommodation,
});

type Accommodation = {
  id: string;
  name: string;
  type: string;
  pricePerMonth: number;
  campus: string | null;
  distanceText: string | null;
  rating: number | null;
  reviewsCount: number;
  amenities: string[];
  isVerified: boolean;
  nsfasAccredited: boolean;
  isFavourited: boolean;
};

const typeLabels: Record<string, string> = {
  single_room: "Single Room",
  shared_room: "Shared Room",
  bachelor: "Bachelor",
  res: "Res",
  apartment: "Apartment",
};
const tabs = [
  { id: "all", label: "All" },
  { id: "single_room", label: "Single Room" },
  { id: "shared_room", label: "Shared Room" },
  { id: "bachelor", label: "Bachelor" },
  { id: "res", label: "Res" },
];

const amenityMeta: Record<string, { icon: typeof Wifi; label: string }> = {
  wifi: { icon: Wifi, label: "Wi-Fi" },
  meals: { icon: Utensils, label: "Meals" },
  transport: { icon: Bus, label: "Transport" },
};
const typeEmoji: Record<string, string> = {
  single_room: "🏢",
  shared_room: "🏘️",
  bachelor: "🏬",
  res: "🏫",
  apartment: "🏙️",
};

function Accommodation() {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(6000);
  const [nsfasOnly, setNsfasOnly] = useState(false);
  const [favOverride, setFavOverride] = useState<Record<string, boolean>>({});
  // Accommodation whose details modal is open (fallback data for the detail fetch).
  const [detail, setDetail] = useState<Accommodation | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["accommodations", tab, nsfasOnly],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (tab !== "all") qs.set("type", tab);
      if (nsfasOnly) qs.set("nsfasOnly", "true");
      return api.get<Accommodation[]>(`/api/Accommodations?${qs.toString()}`);
    },
  });

  const favourite = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on ? api.post(`/api/Accommodations/${id}/favourite`) : api.del(`/api/Accommodations/${id}/favourite`),
  });

  const isFav = (a: Accommodation) => favOverride[a.id] ?? a.isFavourited;
  function toggleFav(a: Accommodation) {
    const next = !isFav(a);
    setFavOverride((m) => ({ ...m, [a.id]: next }));
    favourite.mutate({ id: a.id, on: next });
  }

  const all = data ?? [];
  const filtered = useMemo(
    () =>
      all.filter(
        (p) =>
          p.pricePerMonth <= maxPrice &&
          (query === "" ||
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            (p.campus ?? "").toLowerCase().includes(query.toLowerCase())),
      ),
    [all, query, maxPrice],
  );
  const savedCount = all.filter(isFav).length;

  return (
    <StudentShell>
      <PageHeader
        icon={Home}
        eyebrow="Opportunities"
        title="Accommodation Hub"
        subtitle="Find safe, verified student accommodation near your university."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Home} tone="primary" label="Listings" value={all.length || "—"} />
        <StatCard icon={ShieldCheck} tone="emerald" label="Verified" value={all.filter((a) => a.isVerified).length} />
        <StatCard icon={Sparkles} tone="indigo" label="NSFAS accredited" value={all.filter((a) => a.nsfasAccredited).length} />
        <StatCard icon={Heart} tone="rose" label="Saved" value={savedCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <Panel title="Filters" className="h-fit">
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Search</label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="University or area…"
                  className="w-full rounded-lg border border-border/70 bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">Max price / month</label>
                <span className="text-xs font-bold text-primary">R {maxPrice.toLocaleString()}</span>
              </div>
              <input
                type="range" min={2000} max={6000} step={100} value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="mt-2 w-full accent-primary"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={nsfasOnly} onChange={(e) => setNsfasOnly(e.target.checked)} className="accent-primary" />
              NSFAS accredited only
            </label>
          </div>
        </Panel>

        {/* Results */}
        <div>
          <div className="mb-4 inline-flex flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === t.id ? "bg-card text-foreground shadow-(--shadow-xs)" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {isLoading && <CardGridSkeleton columns="sm:grid-cols-2" />}
          {isError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
              Couldn't load accommodation right now. Please try again shortly.
            </div>
          )}

          {!isLoading && !isError && (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((p) => (
                <div key={p.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-(--shadow-card) transition-all hover:-translate-y-1 hover:shadow-(--shadow-md)">
                  <div className="relative flex h-36 items-center justify-center bg-linear-to-br from-primary/10 to-brand-cyan/10 text-5xl">
                    {typeEmoji[p.type] ?? "🏠"}
                    <button
                      onClick={() => toggleFav(p)}
                      className={cn(
                        "absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm transition-colors",
                        isFav(p) ? "text-rose-500" : "text-muted-foreground hover:text-rose-500",
                      )}
                      aria-label="Save accommodation"
                    >
                      <Heart className={cn("h-4 w-4", isFav(p) && "fill-current")} />
                    </button>
                    {p.isVerified && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-tight">{p.name}</h3>
                      {p.nsfasAccredited && <StatusPill tone="indigo" dot={false} className="shrink-0 px-2 py-0.5 text-[10px]">NSFAS</StatusPill>}
                    </div>
                    {(p.distanceText || p.campus) && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {p.distanceText ?? p.campus}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {typeLabels[p.type] ?? p.type}</span>
                      {p.rating != null && (
                        <span className="inline-flex items-center gap-0.5 text-amber-500">
                          <Star className="h-3 w-3 fill-current" /> {p.rating} <span className="text-muted-foreground">({p.reviewsCount})</span>
                        </span>
                      )}
                    </div>
                    {p.amenities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.amenities.map((a) => {
                          const A = amenityMeta[a];
                          return (
                            <span key={a} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {A ? <A.icon className="h-3 w-3" /> : <Tag className="h-3 w-3" />} {A?.label ?? a}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
                      <span className="text-base font-bold text-primary">
                        R {p.pricePerMonth.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </span>
                      <button onClick={() => setDetail(p)} className={cn(btn.primary, "h-8 px-3 py-0 text-xs")}>View</button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="sm:col-span-2 rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
                  No accommodation matches your filters.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {detail && (
        <AccommodationDetailModal
          fallback={detail}
          isFav={isFav(detail)}
          onToggleFav={() => toggleFav(detail)}
          onClose={() => setDetail(null)}
        />
      )}
    </StudentShell>
  );
}

function AccommodationDetailModal({
  fallback,
  isFav,
  onToggleFav,
  onClose,
}: {
  fallback: Accommodation;
  isFav: boolean;
  onToggleFav: () => void;
  onClose: () => void;
}) {
  // GET /api/Accommodations/{id} may 404 until deployed — fall back to the list item.
  const { data, isLoading } = useQuery({
    queryKey: ["accommodation", fallback.id],
    queryFn: () => api.get<Accommodation>(`/api/Accommodations/${fallback.id}`),
    retry: false,
  });
  const a = data ?? fallback;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex h-40 items-center justify-center bg-linear-to-br from-primary/10 to-brand-cyan/10 text-6xl">
          {typeEmoji[a.type] ?? "🏠"}
          <button onClick={onClose} className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-muted-foreground shadow-sm transition-colors hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={onToggleFav}
            aria-label="Save accommodation"
            className={cn(
              "absolute right-14 top-3 rounded-full bg-white/90 p-2 shadow-sm transition-colors",
              isFav ? "text-rose-500" : "text-muted-foreground hover:text-rose-500",
            )}
          >
            <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
          </button>
          {a.isVerified && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>

        <div className="space-y-5 p-6">
          {isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading details…</div>}

          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold leading-tight">{a.name}</h2>
              {(a.distanceText || a.campus) && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {a.distanceText ?? a.campus}
                </p>
              )}
            </div>
            {a.nsfasAccredited && <StatusPill tone="indigo" dot={false} className="shrink-0 px-2 py-0.5 text-[10px]">NSFAS</StatusPill>}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {typeLabels[a.type] ?? a.type}</span>
            {a.rating != null && (
              <span className="inline-flex items-center gap-0.5 text-amber-500">
                <Star className="h-3 w-3 fill-current" /> {a.rating} <span className="text-muted-foreground">({a.reviewsCount})</span>
              </span>
            )}
          </div>

          {a.amenities.length > 0 && (
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Amenities</div>
              <div className="flex flex-wrap gap-1.5">
                {a.amenities.map((am) => {
                  const A = amenityMeta[am];
                  return (
                    <span key={am} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {A ? <A.icon className="h-3 w-3" /> : <Tag className="h-3 w-3" />} {A?.label ?? am}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between border-t border-border/60 bg-card px-6 py-4">
          <span className="text-lg font-bold text-primary">
            R {a.pricePerMonth.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span>
          </span>
          <button className={btn.outline} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
