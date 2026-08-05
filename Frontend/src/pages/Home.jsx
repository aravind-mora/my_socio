import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, X, WifiOff } from "lucide-react";
import ServiceCard from "../components/ServiceCard";
import { EmptyState, Spinner, Stat, TiltCard } from "../components/Misc";
import { apiGetServices, errMsg } from "../api/client";
import { CATEGORIES } from "../config";
import { useToast } from "../context/ToastContext";

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Price: Low → High" },
  { id: "price_desc", label: "Price: High → Low" },
  { id: "rating", label: "Top Rated" },
];

export default function Home() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* debounce search input */
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Backend supports category/minPrice/maxPrice/minRating — we fetch all
      // and do search-text + sort filtering client-side for a snappy UX.
      const params = { category: category || undefined };
      const res = await apiGetServices(params);
      const list = Array.isArray(res) ? res : res?.services || res?.data || [];
      setServices(list);
    } catch (e) {
      setError(errMsg(e, "Couldn't load services."));
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    let list = services.filter((s) => {
      if (!q) return true;
      const hay = `${s.title} ${s.description} ${s.category} ${s.provider?.fullName || ""}`.toLowerCase();
      return hay.includes(q);
    });
    if (sort === "price_asc") list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "price_desc") list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "rating") list = [...list].sort((a, b) => (b.provider?.averageRating || 0) - (a.provider?.averageRating || 0));
    return list;
  }, [services, debounced, sort]);

  const hasFilters = query || category || sort !== "newest";

  return (
    <div className="container page">
      {/* hero */}
      <section className="hero">
        <motion.div className="hero-badge" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Sparkles size={14} /> Trusted local services, verified by the community
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          Need a hand? <span className="grad-text">Find a pro</span> 🪐
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          Search thousands of services near you — from plumbing to photography — book in seconds,
          chat live, and pay safely.
        </motion.p>

        {/* search */}
        <motion.div className="row wrap" style={{ justifyContent: "center" }} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.22 }}>
          <div className="search-wrap grow" style={{ maxWidth: 560, minWidth: 280 }}>
            <Search size={19} color="var(--text-faint)" />
            <input
              placeholder="Search 'plumber', 'tutor', 'AC repair'…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer" }}>
                <X size={17} />
              </button>
            )}
            <button className="search-btn" onClick={load}>
              <Search size={16} /> Search
            </button>
          </div>

          <select className="input" style={{ width: "auto", minWidth: 170, borderRadius: 999 }} value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </motion.div>

        {/* category chips */}
        <motion.div className="row wrap" style={{ justifyContent: "center", gap: 10, marginTop: 26 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <button className={`chip ${!category ? "active" : ""}`} onClick={() => setCategory("")}>✨ All</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={`chip ${category === c.id ? "active" : ""}`} onClick={() => setCategory(category === c.id ? "" : c.id)}>
              <span>{c.emoji}</span> {c.label}
            </button>
          ))}
        </motion.div>
      </section>

      {/* stats strip */}
      <motion.div className="grid-stats mt-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <TiltCard><Stat emoji="🧰" value="1,200+" label="Services live" /></TiltCard>
        <TiltCard><Stat emoji="👥" value="850+" label="Verified pros" /></TiltCard>
        <TiltCard><Stat emoji="⭐" value="4.8/5" label="Avg. rating" /></TiltCard>
        <TiltCard><Stat emoji="⚡" value="24h" label="Response time" /></TiltCard>
      </motion.div>

      {/* results */}
      <div className="row-between wrap mt-40 mb-20">
        <h2 className="section-title">
          {category ? (CATEGORIES.find((c) => c.id === category)?.emoji + " ") : ""}
          {hasFilters ? "Results" : "Trending services"}
          <span className="grad-text">.</span>
        </h2>
        <span className="tiny">{filtered.length} service{filtered.length === 1 ? "" : "s"} found</span>
      </div>

      {loading ? (
        <div className="grid-services">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass" style={{ padding: 0, overflow: "hidden" }}>
              <div className="shimmer" style={{ height: 168, borderRadius: 0 }} />
              <div style={{ padding: 18 }}>
                <div className="shimmer" style={{ height: 18, width: "70%" }} />
                <div className="shimmer mt-12" style={{ height: 12, width: "40%" }} />
                <div className="shimmer mt-12" style={{ height: 12, width: "90%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          emoji="📡"
          title="Couldn't reach the sphere"
          text={error + " Make sure the SocioSphere backend is running and the API URL is correct."}
          action={<button className="btn btn-primary" onClick={load}><WifiOff size={16} /> Retry</button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🔭"
          title="No services found"
          text="Try a different search term, clear the category filter, or check back soon — new pros join every day."
          action={<button className="btn btn-ghost" onClick={() => { setQuery(""); setCategory(""); setSort("newest"); }}>Clear filters</button>}
        />
      ) : (
        <div className="grid-services">
          {filtered.map((s, i) => <ServiceCard key={s._id || s.id || i} service={s} index={i} />)}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="center mt-30">
          <button className="btn btn-lime" onClick={load} disabled={loading}>
            {loading ? <Spinner /> : "Refresh services ↻"}
          </button>
        </div>
      )}
    </div>
  );
}
