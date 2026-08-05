import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, Rocket, Store, ImagePlus, X, Hourglass, MapPin, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiGetServices, apiCreateService, apiUpdateService, apiDeleteService, apiProviderDashboard, errMsg } from "../api/client";
import { CATEGORIES, CITY_COORDS, PRESET_SLOTS } from "../config";
import { fmtMoney, categoryArt, gradFor, initialsOf } from "../utils/helpers";
import Modal from "../components/Modal";
import { EmptyState, FullScreenLoader, Spinner, TiltCard } from "../components/Misc";
import StarRating from "../components/StarRating";

const emptyForm = {
  title: "", category: "Plumbing", price: "", description: "",
  slots: [], slotInput: "", city: "Hyderabad", lat: "", lng: "",
};

export default function Provider() {
  const { user, isProvider, refresh } = useAuth();
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [dash, setDash] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const all = await apiGetServices();
      const list = Array.isArray(all) ? all : [];
      const mine = list.filter((s) => String(s.provider?.id || s.provider?._id) === String(user.id || user._id));
      setServices(mine);
      apiProviderDashboard().then(setDash).catch(() => {});
    } catch (e) {
      toast.error(errMsg(e, "Couldn't load your services."));
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { if (isProvider) load(); else setLoading(false); }, [isProvider, load]);

  if (loading) return <FullScreenLoader text="Loading your studio…" />;

  if (!isProvider) {
    return (
      <div className="container page">
        <EmptyState
          emoji="🚀"
          title="You're not a provider yet"
          text="Upgrade your account in Profile to start creating services, receiving requests, bidding and chatting with customers."
          action={<Link to="/profile" className="btn btn-lime"><Rocket size={17} /> Upgrade in Profile</Link>}
        />
      </div>
    );
  }

  if (!user.isVerified) {
    return (
      <div className="container page">
        <motion.div className="glass glass-strong center" style={{ maxWidth: 520, margin: "0 auto", padding: "46px 32px" }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ fontSize: "3.4rem" }}>⏳</div>
          <h1 style={{ fontSize: "1.6rem", margin: "12px 0 8px" }}>Awaiting admin verification</h1>
          <p className="muted" style={{ lineHeight: 1.65, marginBottom: 18 }}>
            You're now a provider 🚀 — but the backend requires an admin to verify your account before you can publish services. Check back soon, or ask your admin to verify via the admin panel.
          </p>
          <div className="row" style={{ justifyContent: "center", gap: 10 }}>
            <Link to="/profile" className="btn btn-ghost">Profile</Link>
            <button className="btn btn-primary" onClick={refresh}><Hourglass size={16} /> Check again</button>
          </div>
        </motion.div>
      </div>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, lat: "17.3850", lng: "78.4867" });
    setImageFiles([]);
    setImagePreviews([]);
    setModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    const coords = s.location?.coordinates || [];
    setForm({
      title: s.title || "", category: s.category || "Plumbing", price: s.price ?? "", description: s.description || "",
      slots: s.slots || [], slotInput: "", city: "Custom", lat: coords[1] ?? "", lng: coords[0] ?? "",
    });
    setImageFiles([]);
    setImagePreviews([]);
    setModal(true);
  };

  const pickCity = (name) => {
    const c = CITY_COORDS.find((x) => x.name === name);
    if (c) setForm((f) => ({ ...f, city: name, lat: String(c.lat), lng: String(c.lng) }));
  };

  const toggleSlot = (s) =>
    setForm((f) => ({
      ...f,
      slots: f.slots.includes(s) ? f.slots.filter((x) => x !== s) : [...f.slots, s],
    }));

  const addSlot = () => {
    const v = form.slotInput.trim();
    if (!v) return;
    if (form.slots.includes(v)) return toast.info("Slot already added");
    setForm((f) => ({ ...f, slots: [...f.slots, v], slotInput: "" }));
  };

  const onImages = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    if (!files.length) return;
    const tooBig = files.some((f) => f.size > 2 * 1024 * 1024);
    if (tooBig) return toast.error("Each image must be under 2MB 🖼️");
    setImageFiles(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("category", form.category);
    fd.append("description", form.description.trim());
    fd.append("price", String(Number(form.price)));
    form.slots.forEach((s) => fd.append("slots", s));
    fd.append("location[lat]", form.lat);
    fd.append("location[lng]", form.lng);
    imageFiles.forEach((f) => fd.append("images", f));
    return fd;
  };

  const save = async () => {
    if (form.title.trim().length < 4) return toast.error("Give your service a clear title 📝");
    const price = Number(form.price);
    if (!price || price <= 0) return toast.error("Enter a valid price (₹)");
    if (form.description.trim().length < 20) return toast.error("Describe the service in at least 20 characters ✍️");
    if (!form.slots.length) return toast.error("Add at least one time slot 🕐");
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)
      return toast.error("Invalid location coordinates 📍");
    setBusy(true);
    try {
      const fd = buildFormData();
      if (editing) {
        await apiUpdateService(editing.id || editing._id, fd);
        toast.success("Service updated ✅");
      } else {
        await apiCreateService(fd);
        toast.success("Service published! 🎉");
      }
      setModal(false);
      load();
    } catch (e) {
      toast.error(errMsg(e, "Couldn't save the service."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete "${s.title}" permanently? This can't be undone.`)) return;
    setDeletingId(s.id || s._id);
    try {
      await apiDeleteService(s.id || s._id);
      toast.success("Service deleted 🗑️");
      load();
    } catch (e) {
      toast.error(errMsg(e, "Couldn't delete the service."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container page">
      <div className="row-between wrap mb-20">
        <div>
          <h1 className="section-title">My <span className="grad-text">Studio</span> 🧰</h1>
          <p className="muted">Create, update and manage the services you offer.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> New service</button>
      </div>

      {dash && (
        <div className="grid-stats mb-30">
          <TiltCard><div className="glass center" style={{ padding: 18 }}><div style={{ fontSize: "1.6rem" }}>💰</div><div className="display" style={{ fontSize: "1.2rem" }}>{fmtMoney(dash.totalEarnings)}</div><div className="tiny">Total earnings</div></div></TiltCard>
          <TiltCard><div className="glass center" style={{ padding: 18 }}><div style={{ fontSize: "1.6rem" }}>✅</div><div className="display" style={{ fontSize: "1.2rem" }}>{dash.completedJobs}</div><div className="tiny">Completed jobs</div></div></TiltCard>
          <TiltCard><div className="glass center" style={{ padding: 18 }}><div style={{ fontSize: "1.6rem" }}>⏳</div><div className="display" style={{ fontSize: "1.2rem" }}>{dash.pendingJobs}</div><div className="tiny">Pending</div></div></TiltCard>
          <TiltCard><div className="glass center" style={{ padding: 18 }}><div style={{ fontSize: "1.6rem" }}>💸</div><div className="display" style={{ fontSize: "1.2rem" }}>{dash.paidJobs}</div><div className="tiny">Paid jobs</div></div></TiltCard>
        </div>
      )}

      {services.length === 0 ? (
        <EmptyState
          emoji="🛠️"
          title="No services yet"
          text="Create your first service — plumbing, tutoring, photography… anything you're great at!"
          action={<button className="btn btn-primary" onClick={openCreate}><Plus size={17} /> Create service</button>}
        />
      ) : (
        <div className="grid-services">
          {services.map((s, i) => {
            const art = categoryArt(s.category);
            return (
              <motion.div key={s.id || s._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <TiltCard>
                  <div className="glass card-hover" style={{ overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
                    <div className="service-thumb" style={{ background: gradFor(s.category) }}>
                      {s.images?.[0] ? <img src={s.images[0]} alt={s.title} /> : <span>{art.emoji}</span>}
                      <span className="tag" style={{ position: "absolute", top: 12, left: 12, background: "rgba(13,7,22,0.75)", color: "#ffd166" }}>{art.label}</span>
                    </div>
                    <div className="service-body">
                      <div className="row-between">
                        <h3 style={{ fontSize: "1.05rem" }}>{s.title}</h3>
                        <span className="display" style={{ fontSize: "1.05rem" }}>{fmtMoney(s.price)}</span>
                      </div>
                      <div className="row" style={{ gap: 5 }}>
                        <StarRating value={0} size="0.9rem" />
                        <span className="tiny">(provider rating on card)</span>
                      </div>
                      <div className="row wrap" style={{ gap: 6, fontSize: "0.75rem", color: "var(--text-dim)" }}>
                        <span className="row" style={{ gap: 4 }}><Clock size={12} /> {s.slots?.length || 0} slots</span>
                        {s.location?.coordinates && (
                          <span className="row" style={{ gap: 4 }}><MapPin size={12} /> {s.location.coordinates[1]?.toFixed(2)}, {s.location.coordinates[0]?.toFixed(2)}</span>
                        )}
                      </div>
                      <p className="tiny" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.description}</p>
                      <div className="row wrap" style={{ gap: 8, marginTop: 10 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}><Pencil size={14} /> Edit</button>
                        <button className="btn btn-ghost btn-sm" disabled={deletingId === (s.id || s._id)} onClick={() => remove(s)}>
                          {deletingId === (s.id || s._id) ? <Spinner size={14} /> : <Trash2 size={14} />} Delete
                        </button>
                        <Link to={`/service/${s.id || s._id}`} className="btn btn-ghost btn-sm"><Eye size={14} /> View</Link>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* create / edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit service" : "Create a new service"} wide>
        <div className="modal-2col" style={{ display: "grid", gap: 14 }}>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Service title</label>
            <input className="input" placeholder="e.g. Home plumbing repair & installation" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="field">
            <label>Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Price (₹)</label>
            <input className="input" inputMode="numeric" placeholder="e.g. 499" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/\D/g, "") }))} />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Description</label>
            <textarea className="textarea" placeholder="What exactly will you do? What's included? Any certifications?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>

          {/* slots */}
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>🕐 Time slots</label>
            <div className="row wrap" style={{ gap: 8, marginBottom: 10 }}>
              {PRESET_SLOTS.map((s) => (
                <button key={s} type="button" className={`chip ${form.slots.includes(s) ? "active" : ""}`} onClick={() => toggleSlot(s)}>{s}</button>
              ))}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <input className="input grow" placeholder="Custom slot, e.g. 'Weekends 4 PM'" value={form.slotInput} onChange={(e) => setForm((f) => ({ ...f, slotInput: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSlot())} />
              <button className="btn btn-ghost btn-sm" type="button" onClick={addSlot}><Plus size={15} /> Add</button>
            </div>
            {form.slots.length > 0 && (
              <div className="row wrap mt-8" style={{ gap: 6 }}>
                {form.slots.map((s) => (
                  <span key={s} className="chip" style={{ cursor: "pointer" }} onClick={() => toggleSlot(s)}>🕐 {s} <X size={12} /></span>
                ))}
              </div>
            )}
          </div>

          {/* location */}
          <div className="field">
            <label>📍 Location (city preset)</label>
            <select className="input" value={form.city} onChange={(e) => pickCity(e.target.value)}>
              {CITY_COORDS.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              <option value="Custom">Custom coordinates…</option>
            </select>
          </div>
          <div className="row" style={{ gap: 10, alignItems: "flex-end" }}>
            <div className="field grow">
              <label>Latitude</label>
              <input className="input" placeholder="17.3850" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} />
            </div>
            <div className="field grow">
              <label>Longitude</label>
              <input className="input" placeholder="78.4867" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} />
            </div>
          </div>

          {/* images */}
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Cover images <span className="tiny">(max 5 · JPG/PNG · ≤2MB each)</span></label>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" multiple hidden onChange={onImages} />
            <div className="row wrap" style={{ gap: 10 }}>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => fileRef.current?.click()}><ImagePlus size={15} /> Upload {imageFiles.length ? `(${imageFiles.length})` : "images"}</button>
              {imagePreviews.map((src, i) => (
                <img key={i} src={src} alt={`preview ${i}`} style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 10, border: "1px solid var(--stroke)" }} />
              ))}
              {editing?.images?.length > 0 && imageFiles.length === 0 && (
                <span className="tiny">Existing images: {editing.images.length} (new uploads are appended)</span>
              )}
            </div>
          </div>
        </div>
        <button className="btn btn-primary btn-lg btn-block" onClick={save} disabled={busy}>
          {busy ? <Spinner /> : editing ? "Save changes" : <><Store size={17} /> Publish service</>}
        </button>
      </Modal>
    </div>
  );
}
