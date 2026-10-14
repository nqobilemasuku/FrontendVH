/* eslint-disable prettier/prettier */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, ArrowRight, Heart, Scale, X, Banknote, Award, Check } from "lucide-react";
import { CardGridSkeleton } from "@/components/dashboard/skeletons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export type Uni = {
  id: string;
  name: string;
  shortCode: string;
  province: string;
  minAps: number | null;
  tuitionFrom: number | null;
  programmesCount: number;
  facultiesCount: number;
};

const provinces = ["All", "Gauteng", "Western Cape", "KwaZulu Natal", "Eastern Cape", "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape"];
const gradients = [
  "from-[oklch(0.6_0.18_25)] to-[oklch(0.55_0.2_15)]",
  "from-[oklch(0.55_0.18_260)] to-[oklch(0.5_0.2_290)]",
  "from-[oklch(0.55_0.16_150)] to-[oklch(0.5_0.18_170)]",
  "from-[oklch(0.55_0.18_50)] to-[oklch(0.5_0.18_30)]",
  "from-[oklch(0.55_0.18_220)] to-[oklch(0.5_0.2_250)]",
  "from-[oklch(0.55_0.18_280)] to-[oklch(0.5_0.2_310)]",
];

/**
 * The university search / compare / favourites experience, with no page chrome.
 * Rendered by both the public `/universities` page and the in-dashboard
 * `/browse-universities` page.
 */
export function UniversitiesExplorer() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("All");
  const [favourites, setFavourites] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["universities", query, province],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (query) qs.set("q", query);
      if (province && province !== "All") qs.set("province", province);
      return api.get<Uni[]>(`/api/Universities?${qs.toString()}`, { auth: false });
    },
  });

  useQuery({
    queryKey: ["universities", "favourites"],
    enabled: !!token,
    queryFn: async () => {
      const favs = await api.get<Uni[]>("/api/Universities/favourites/my");
      setFavourites(favs.map((u) => u.id));
      return favs;
    },
  });

  const unis = data ?? [];
  const compareList = unis.filter((u) => compare.includes(u.id));

  function toggleFav(id: string) {
    const has = favourites.includes(id);
    setFavourites((p) => (has ? p.filter((x) => x !== id) : [...p, id]));
    (has ? api.del(`/api/Universities/${id}/favourite`) : api.post(`/api/Universities/${id}/favourite`)).catch(() => {});
  }
  function toggleCompare(id: string) {
    setCompare((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-(--shadow-soft) sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, e.g. Stellenbosch"
            className="w-full rounded-lg border border-border/60 bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select value={province} onChange={(e) => setProvince(e.target.value)} className="rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm">
          {provinces.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {isLoading && <CardGridSkeleton className="mt-6" />}
      {isError && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load universities right now. Please try again shortly.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>{unis.length} universit{unis.length === 1 ? "y" : "ies"} found</span>
            {favourites.length > 0 && (
              <span className="inline-flex items-center gap-1 text-rose-500"><Heart className="h-4 w-4 fill-current" /> {favourites.length} saved</span>
            )}
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {unis.map((u, i) => {
              const inCompare = compare.includes(u.id);
              const isFav = favourites.includes(u.id);
              return (
                <article key={u.id} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-(--shadow-soft) transition-all hover:-translate-y-1 hover:shadow-(--shadow-card)">
                  <button onClick={() => toggleFav(u.id)} aria-label="Save to favourites"
                    className={cn("absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition-colors", isFav ? "text-rose-500" : "text-muted-foreground hover:text-rose-500")}>
                    <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
                  </button>
                  <div className={`relative h-28 bg-linear-to-br ${gradients[i % gradients.length]}`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="grid h-16 w-16 place-items-center rounded-xl bg-white/95 p-2 shadow-md text-lg font-extrabold text-foreground">
                        {u.shortCode}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-bold leading-tight">{u.name}</h3>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {u.province}</div>
                    <div className="mt-4 grid grid-cols-2 gap-y-2 border-t border-border/60 pt-3 text-xs">
                      <span><span className="font-bold text-foreground">{u.programmesCount}</span> programmes</span>
                      <span><span className="font-bold text-foreground">{u.facultiesCount}</span> faculties</span>
                      {u.minAps != null && <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5 text-primary" /> APS from <span className="font-bold text-foreground">{u.minAps}</span></span>}
                      {u.tuitionFrom != null && <span className="inline-flex items-center gap-1"><Banknote className="h-3.5 w-3.5 text-emerald-600" /> R{(u.tuitionFrom / 1000).toFixed(0)}k+/yr</span>}
                    </div>
                    <div className="mt-auto flex items-center gap-2 pt-4">
                      <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                        View profile <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => toggleCompare(u.id)} disabled={!inCompare && compare.length >= 3}
                        className={cn("inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors", inCompare ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50")}>
                        <Scale className="h-3.5 w-3.5" /> {inCompare ? "Added" : "Compare"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {unis.length === 0 && (
            <div className="mt-6 rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">No universities match your search.</div>
          )}
        </>
      )}

      {compare.length > 0 && (
        <div className="sticky bottom-0 z-30 mt-6 -mx-1 border-t border-border/60 bg-card/95 backdrop-blur-md">
          <div className="flex items-center gap-4 px-2 py-3">
            <span className="hidden text-sm font-semibold sm:block">Comparing {compare.length}/3</span>
            <div className="flex flex-1 items-center gap-2 overflow-x-auto">
              {compareList.map((u) => (
                <span key={u.id} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {u.shortCode}
                  <button onClick={() => toggleCompare(u.id)} aria-label={`Remove ${u.shortCode}`}><X className="h-3 w-3 text-muted-foreground hover:text-foreground" /></button>
                </span>
              ))}
            </div>
            <button onClick={() => setCompare([])} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            <button onClick={() => setShowCompare(true)} disabled={compare.length < 2}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
              <Scale className="h-4 w-4" /> Compare
            </button>
          </div>
        </div>
      )}

      {showCompare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCompare(false)}>
          <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
              <h2 className="text-lg font-bold">Compare universities</h2>
              <button onClick={() => setShowCompare(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-x-auto p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="w-40 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Criteria</th>
                    {compareList.map((u) => (
                      <th key={u.id} className="px-3 py-3 text-center"><span className="text-xs font-bold">{u.shortCode}</span></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Province", get: (u: Uni) => u.province },
                    { label: "Programmes", get: (u: Uni) => String(u.programmesCount) },
                    { label: "Faculties", get: (u: Uni) => String(u.facultiesCount) },
                    { label: "Minimum APS", get: (u: Uni) => (u.minAps != null ? String(u.minAps) : "—") },
                    { label: "Tuition from", get: (u: Uni) => (u.tuitionFrom != null ? `R ${u.tuitionFrom.toLocaleString()}/yr` : "—") },
                    { label: "Saved", get: (u: Uni) => (favourites.includes(u.id) ? "yes" : "no") },
                  ].map((row) => (
                    <tr key={row.label} className="border-t border-border/50">
                      <td className="py-3 text-xs font-semibold text-muted-foreground">{row.label}</td>
                      {compareList.map((u) => (
                        <td key={u.id} className="px-3 py-3 text-center">
                          {row.label === "Saved"
                            ? (row.get(u) === "yes" ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : <X className="mx-auto h-4 w-4 text-muted-foreground/40" />)
                            : <span className="font-medium">{row.get(u)}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
