/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  Search,
  Plus,
  Heart,
  MessageCircle,
  ShieldCheck,
  Laptop,
  BookOpen,
  Sofa,
  Shirt,
  Wrench,
  Tag,
  Package,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { StudentShell } from "@/components/StudentShell";
import {
  PageHeader,
  StatCard,
  Panel,
  StatusPill,
  IconBadge,
  btn,
  type Tone,
} from "@/components/dashboard/ui";
import { CardGridSkeleton } from "@/components/dashboard/skeletons";
import { api, getToken } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [{ title: "Market Hub · Varsity Hub" }] }),
  component: Marketplace,
});

type Listing = {
  id: string;
  sellerId: string;
  title: string;
  category: string;
  price: number;
  condition: string;
  campus: string | null;
  description: string | null;
  status: string;
  images: string[];
  createdAt: string;
};

type Message = { id: string; senderId: string; body: string; createdAt: string };

const categories: { id: string; label: string; icon: typeof Store; tone: Tone }[] = [
  { id: "", label: "All", icon: Store, tone: "primary" },
  { id: "electronics", label: "Electronics", icon: Laptop, tone: "blue" },
  { id: "textbooks", label: "Textbooks", icon: BookOpen, tone: "emerald" },
  { id: "furniture", label: "Furniture", icon: Sofa, tone: "amber" },
  { id: "clothing", label: "Clothing", icon: Shirt, tone: "fuchsia" },
  { id: "services", label: "Services", icon: Wrench, tone: "indigo" },
  { id: "other", label: "Other", icon: Package, tone: "slate" },
];

const categoryEmoji: Record<string, string> = {
  electronics: "💻",
  textbooks: "📘",
  furniture: "🪑",
  clothing: "🧥",
  services: "🛠️",
  other: "🏷️",
};
const categoryLabel: Record<string, string> = {
  electronics: "Electronics",
  textbooks: "Textbooks",
  furniture: "Furniture",
  clothing: "Clothing",
  services: "Services",
  other: "Other",
};

// Exact lowercase enum values the backend (NewListing) requires for `condition`.
const conditions: { value: string; label: string }[] = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "service", label: "Service" },
];
const conditionLabel: Record<string, string> = Object.fromEntries(
  conditions.map((c) => [c.value, c.label]),
);

function Marketplace() {
  const qc = useQueryClient();
  const [cat, setCat] = useState("");
  const [query, setQuery] = useState("");
  const [condFilter, setCondFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showSell, setShowSell] = useState(false);
  const [chatWith, setChatWith] = useState<Listing | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listings", cat, condFilter, minPrice, maxPrice],
    queryFn: () => {
      // Pass filters to the backend (it is adding support for these); the grid
      // is ALSO filtered client-side below so it works regardless of backend.
      const qs = new URLSearchParams();
      if (cat) qs.set("category", cat);
      if (condFilter) qs.set("condition", condFilter);
      if (minPrice) qs.set("minPrice", minPrice);
      if (maxPrice) qs.set("maxPrice", maxPrice);
      const q = qs.toString();
      return api.get<Listing[]>(`/api/listings${q ? `?${q}` : ""}`);
    },
  });

  const wish = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on ? api.post(`/api/listings/${id}/wishlist`) : api.del(`/api/listings/${id}/wishlist`),
  });

  const listings = (data ?? []).filter((l) => {
    // Search: title OR description contains the query.
    if (query) {
      const q = query.toLowerCase();
      const inText =
        l.title.toLowerCase().includes(q) ||
        (l.description ?? "").toLowerCase().includes(q);
      if (!inText) return false;
    }
    // Category.
    if (cat && l.category !== cat) return false;
    // Condition.
    if (condFilter && l.condition !== condFilter) return false;
    // Price range.
    if (minPrice !== "") {
      const min = Number(minPrice);
      if (!Number.isNaN(min) && l.price < min) return false;
    }
    if (maxPrice !== "") {
      const max = Number(maxPrice);
      if (!Number.isNaN(max) && l.price > max) return false;
    }
    return true;
  });

  function toggleWish(id: string) {
    const has = wishlist.includes(id);
    setWishlist((prev) => (has ? prev.filter((x) => x !== id) : [...prev, id]));
    wish.mutate({ id, on: !has });
  }

  return (
    <StudentShell>
      <PageHeader
        icon={Store}
        eyebrow="Opportunities"
        title="Market Hub"
        subtitle="Buy and sell textbooks, electronics, furniture and more — safely, student to student."
        actions={
          <button className={btn.primary} onClick={() => setShowSell(true)}>
            <Plus className="h-4 w-4" /> Sell an item
          </button>
        }
      />

      {/* Campus-only verification banner */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <IconBadge icon={ShieldCheck} tone="emerald" />
        <p className="text-sm text-emerald-800">
          <span className="font-semibold">Verified students only.</span> Every buyer and seller is a
          confirmed university student, so you can trade with confidence.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Store} tone="primary" label="Active listings" value={data?.length ?? "—"} />
        <StatCard
          icon={Tag}
          tone="emerald"
          label="Categories"
          value={new Set((data ?? []).map((l) => l.category)).size || "—"}
        />
        <StatCard icon={Heart} tone="rose" label="Wishlist" value={wishlist.length} />
        <StatCard icon={Package} tone="indigo" label="Showing" value={listings.length} />
      </div>

      {/* Category chips */}
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.label}
            onClick={() => setCat(c.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
              cat === c.id
                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                : "border-border/70 bg-card text-muted-foreground hover:bg-muted/50",
            )}
          >
            <c.icon className="h-4 w-4" /> {c.label}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the marketplace…"
            className="w-full rounded-lg border border-border/70 bg-card py-2.5 pl-9 pr-3 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <select
          value={condFilter}
          onChange={(e) => setCondFilter(e.target.value)}
          className="rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          <option value="">Any condition</option>
          {conditions.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min R"
            className="w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
          <span className="text-xs text-muted-foreground">–</span>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max R"
            className="w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm shadow-(--shadow-xs) focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
      </div>

      {isLoading && <CardGridSkeleton />}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Couldn't load the marketplace right now. Please try again shortly.
        </div>
      )}

      {/* Listings grid */}
      {!isLoading && !isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <div
                key={l.id}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-(--shadow-card) transition-all hover:-translate-y-1 hover:shadow-(--shadow-md)"
              >
                <div className="relative flex h-40 items-center justify-center overflow-hidden bg-linear-to-br from-muted to-muted/40 text-5xl">
                  <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    {categoryEmoji[l.category] ?? "🏷️"}
                  </span>
                  {l.images?.[0] && (
                    <img
                      src={l.images[0]}
                      alt={l.title}
                      loading="lazy"
                      className="absolute inset-0 z-10 h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  <button
                    onClick={() => toggleWish(l.id)}
                    className={cn(
                      "absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition-colors",
                      wishlist.includes(l.id) ? "text-rose-500" : "text-muted-foreground hover:text-rose-500",
                    )}
                    aria-label="Add to wishlist"
                  >
                    <Heart className={cn("h-4 w-4", wishlist.includes(l.id) && "fill-current")} />
                  </button>
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground shadow-sm backdrop-blur">
                    {categoryLabel[l.category] ?? l.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold leading-tight">{l.title}</h3>
                    <span className="shrink-0 text-base font-bold text-primary">
                      R {l.price.toLocaleString("en-ZA")}
                    </span>
                  </div>
                  {l.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{l.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusPill tone="slate" dot={false} className="px-2 py-0.5 text-[10px]">
                      {conditionLabel[l.condition] ?? l.condition}
                    </StatusPill>
                    {l.campus && <span>{l.campus}</span>}
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="text-xs text-muted-foreground">
                      Listed {new Date(l.createdAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" })}
                    </span>
                    <button
                      onClick={() => setChatWith(l)}
                      className={cn(btn.soft, "h-7 gap-1 px-2.5 py-0 text-xs")}
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Chat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {listings.length === 0 && (
            <Panel className="mt-4">
              <p className="py-10 text-center text-sm text-muted-foreground">No items match your search.</p>
            </Panel>
          )}
        </>
      )}

      {showSell && (
        <SellModal
          onClose={() => setShowSell(false)}
          onSaved={() => {
            setShowSell(false);
            qc.invalidateQueries({ queryKey: ["listings"] });
          }}
        />
      )}

      {chatWith && <ChatModal listing={chatWith} onClose={() => setChatWith(null)} />}
    </StudentShell>
  );
}

/* ------------------------------ Sell modal ------------------------------ */

function SellModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("electronics");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("good");
  const [campus, setCampus] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);

  const create = useMutation({
    // Body must send the EXACT lowercase enum strings for category/condition.
    mutationFn: () =>
      api.post<Listing>("/api/listings", {
        title,
        category,
        price: Number(price) || 0,
        condition,
        campus: campus || null,
        description: description || null,
      }),
    onSuccess: async (listing) => {
      // No image chosen → just finish.
      if (!file || !listing?.id) {
        onSaved();
        return;
      }
      // Upload the image as multipart/form-data. This is not JSON, so we call
      // fetch directly and attach the Bearer token manually via getToken.
      setUploading(true);
      setUploadFailed(false);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const token = getToken();
        const res = await fetch(`${api.base}/api/listings/${listing.id}/images`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: fd,
        });
        if (!res.ok) throw new Error(`Upload failed (${res.status})`);
        onSaved();
      } catch {
        // Endpoint may 404 until the backend deploys it — the listing itself
        // was still created, so surface a soft warning rather than failing.
        setUploadFailed(true);
      } finally {
        setUploading(false);
      }
    },
  });

  const created = create.isSuccess;
  const busy = create.isPending || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-card px-6 py-4">
          <h2 className="text-lg font-bold">List an item for sale</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          className="space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Calculus Textbook (8th Ed.)"
              className="rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                {categories
                  .filter((c) => c.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Price (R)</span>
              <input
                required
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Condition</span>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                {conditions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Campus</span>
              <input
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                placeholder="e.g. UJ Auckland Park"
                className="rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details buyers should know…"
              className="rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Add a photo (optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="rounded-lg border border-border/70 bg-card px-3 py-2 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </label>
          {create.isError && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              Couldn't create the listing. Please try again.
            </p>
          )}
          {uploadFailed && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Your listing was published, but the photo couldn't be uploaded. You can add it later.
            </p>
          )}
          <div className="flex justify-end gap-2">
            {created && uploadFailed ? (
              <button type="button" onClick={onSaved} className={btn.primary}>
                Done
              </button>
            ) : (
              <>
                <button type="button" onClick={onClose} className={btn.outline}>
                  Cancel
                </button>
                <button type="submit" disabled={busy} className={btn.primary}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
                  {uploading ? "Uploading photo…" : "Publish listing"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------ Chat modal ------------------------------ */

function ChatModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listing-messages", listing.id],
    queryFn: () => api.get<Message[]>(`/api/listings/${listing.id}/messages`),
  });

  const send = useMutation({
    mutationFn: () => api.post(`/api/listings/${listing.id}/messages`, { body }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["listing-messages", listing.id] });
    },
  });

  const messages = data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">{listing.title}</h2>
            <p className="text-xs text-muted-foreground">Message the seller</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          )}
          {isError && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-center text-xs text-rose-700">
              Couldn't load messages.
            </p>
          )}
          {!isLoading && !isError && messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No messages yet. Say hello!</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="text-sm">{m.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(m.createdAt).toLocaleString("en-ZA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </div>
        <form
          className="flex items-center gap-2 border-t border-border/60 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim()) send.mutate();
          }}
        >
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
          <button type="submit" disabled={send.isPending || !body.trim()} className={btn.primary}>
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
