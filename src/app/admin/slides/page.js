"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ImagePlus,
  Trash2,
  Eye,
  EyeOff,
  Star,
  RefreshCw,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  confirmDialog,
  handleSessionExpiry,
  showToast,
  useDebouncedValue,
  useSmartRefetch,
} from "@/lib/adminUi";
import AdminSkeleton from "@/components/admin-skeleton";

export default function AdminSlidesPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [slides, setSlides] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [buttonText, setButtonText] = useState("Shop Now");
  const [category, setCategory] = useState("New Dubai Fashion Style");
  const [discountText, setDiscountText] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSlides = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        const handled = await handleSessionExpiry(
          userError || new Error("Session not authenticated"),
          router
        );
        if (!handled) setMessage("Session lama xaqiijin karin.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("slides")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        const handled = await handleSessionExpiry(error, router);
        if (!handled) setMessage("Slides lama soo qaadi karin: " + error.message);
        setLoading(false);
        return;
      }

      setSlides(data || []);
      setLoading(false);
    },
    [router, supabase]
  );

  useEffect(() => {
    Promise.resolve().then(() => loadSlides());
  }, [loadSlides]);

  useSmartRefetch(loadSlides);

  function clearForm() {
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setButtonText("Shop Now");
    setCategory("New Dubai Fashion Style");
    setDiscountText("");
    setIsActive(true);
    setEditingId(null);
  }

  function editSlide(slide) {
    setEditingId(slide.id);
    setTitle(slide.title || "");
    setSubtitle(slide.subtitle || "");
    setImageUrl(slide.image_url || "");
    setButtonText(slide.button_text || "Shop Now");
    setCategory(slide.category || "New Dubai Fashion Style");
    setDiscountText(slide.discount_text || "");
    setIsActive(slide.is_active !== false);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveSlide(e) {
    e.preventDefault();
    setMessage("");

    if (!title.trim() || !subtitle.trim() || !imageUrl.trim()) {
      setMessage("Fadlan buuxi Title, Subtitle iyo Image URL.");
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      image_url: imageUrl.trim(),
      button_text: buttonText.trim() || "Shop Now",
      category: category.trim() || "New Dubai Fashion Style",
      discount_text: discountText.trim(),
      is_active: isActive,
    };

    if (editingId) {
      const previousSlides = slides;
      setSlides((prev) =>
        prev.map((slide) =>
          slide.id === editingId ? { ...slide, ...payload } : slide
        )
      );

      const { data, error } = await supabase
        .from("slides")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();

      if (error) {
        setSlides(previousSlides);
        const handled = await handleSessionExpiry(error, router);
        if (!handled) setMessage("Update ma shaqayn: " + error.message);
        setSaving(false);
        return;
      }

      setSlides((prev) =>
        prev.map((slide) => (slide.id === editingId ? data : slide))
      );
      setMessage("Slide si sax ah ayaa loo update gareeyay.");
      showToast("Slide updated.");
      clearForm();
      await loadSlides();
      setSaving(false);
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticSlide = {
      id: tempId,
      ...payload,
      created_at: new Date().toISOString(),
    };

    setSlides((prev) => [optimisticSlide, ...prev]);
    clearForm();

    const { data, error } = await supabase
      .from("slides")
      .insert([payload])
      .select()
      .single();

    if (error) {
      setSlides((prev) => prev.filter((slide) => slide.id !== tempId));
      const handled = await handleSessionExpiry(error, router);
      if (!handled) setMessage("Slide lama darin: " + error.message);
      setSaving(false);
      return;
    }

    setSlides((prev) =>
      prev.map((slide) => (slide.id === tempId ? data : slide))
    );
    setMessage("Slide cusub waa la daray.");
    showToast("Slide added.");
    await loadSlides();
    setSaving(false);
  }

  async function setMainSlide(slideId) {
    setMessage("");

    const targetSlide = slides.find((slide) => slide.id === slideId);

    const { error } = await supabase
      .from("slides")
      .update({
        title: targetSlide?.title || "",
        subtitle: targetSlide?.subtitle || "",
        image_url: targetSlide?.image_url || "",
        button_text: targetSlide?.button_text || "Shop Now",
        category: targetSlide?.category || "New Dubai Fashion Style",
        discount_text: targetSlide?.discount_text || "",
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .eq("id", slideId);

    if (error) {
      const handled = await handleSessionExpiry(error, router);
      if (!handled) setMessage("Set Active ma shaqayn: " + error.message);
      return;
    }

    setMessage("Main active hero waa la doortay.");
    await loadSlides();
  }

  async function toggleVisible(slide) {
    const { error } = await supabase
      .from("slides")
      .update({ is_active: !slide.is_active })
      .eq("id", slide.id);

    if (error) {
      const handled = await handleSessionExpiry(error, router);
      if (!handled) setMessage("Show/Hide ma shaqayn: " + error.message);
      return;
    }

    await loadSlides();
  }

  async function deleteSlide(slide) {
    const ok = await confirmDialog({
      title: "Delete slide?",
      text: `Slide-kan "${slide.title || "Untitled"}" ma delete gareynaa?`,
      confirmButtonText: "Delete",
    });
    if (!ok) return;

    const previousSlides = slides;
    const remaining = slides.filter((item) => item.id !== slide.id);
    setSlides(remaining);

    const { error } = await supabase.from("slides").delete().eq("id", slide.id);

    if (error) {
      setSlides(previousSlides);
      const handled = await handleSessionExpiry(error, router);
      if (!handled) setMessage("Delete ma shaqayn: " + error.message);
      return;
    }

    setMessage("Slide waa la delete gareeyay.");
    showToast("Slide deleted.");

    await loadSlides();
  }

  const visibleSlides = useMemo(() => {
    return slides.filter((slide) => slide.is_active !== false);
  }, [slides]);

  const filteredSlides = useMemo(() => {
    const text = debouncedSearch.trim().toLowerCase();
    if (!text) return slides;

    return slides.filter((slide) => {
      return (
        slide.title?.toLowerCase().includes(text) ||
        slide.subtitle?.toLowerCase().includes(text) ||
        slide.category?.toLowerCase().includes(text) ||
        slide.discount_text?.toLowerCase().includes(text)
      );
    });
  }, [slides, debouncedSearch]);

  const activeHero = [...slides]
    .filter((slide) => slide.is_active !== false)
    .sort((a, b) => {
      const bTime = new Date(b?.created_at || 0).getTime();
      const aTime = new Date(a?.created_at || 0).getTime();
      return bTime - aTime;
    })[0];

  return (
    <main className="admin-slides-page responsive-admin-page" style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.badge}>NEW DUBAI ADMIN SYSTEM</p>
          <h1 style={styles.title}>Slides & Promotions</h1>
          <p style={styles.subtitle}>
            Manage dashboard hero banners, promotions and discount text.
          </p>

          <Link href="/admin" style={styles.backHome}>
            <ArrowLeft size={18} />
            Back Home
          </Link>
        </div>

        <div className="responsive-stats-grid" style={styles.statsGrid}>
          <Stat title="All Slides" value={slides.length} />
          <Stat title="Visible" value={visibleSlides.length} />
          <Stat title="Main Hero" value={activeHero ? "1" : "0"} />
        </div>
      </section>

      <section className="responsive-split-layout" style={styles.layout}>
        <aside style={styles.formPanel}>
          <div style={styles.formHead}>
            <div style={styles.iconBox}>
              <ImagePlus size={24} />
            </div>

            <div>
              <h2 style={styles.formTitle}>
                {editingId ? "Edit Slide" : "Add Slide"}
              </h2>
              <p style={styles.formSub}>Hero banner details</p>
            </div>
          </div>

          {message && <div style={styles.message}>{message}</div>}

          <form onSubmit={saveSlide}>
            <Field
              label="Title"
              value={title}
              setValue={setTitle}
              placeholder="Welcome"
            />

            <label style={styles.label}>Subtitle</label>
            <textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Discover premium clothes, shoes and accessories."
              style={styles.textarea}
            />

            <Field
              label="Image URL / Path"
              value={imageUrl}
              setValue={setImageUrl}
              placeholder="/images/classic-shoes.webp"
            />

            <Field
              label="Button Text"
              value={buttonText}
              setValue={setButtonText}
              placeholder="Shop Now"
            />

            <Field
              label="Category / Badge Text"
              value={category}
              setValue={setCategory}
              placeholder="New Dubai Fashion Style"
            />

            <Field
              label="Discount Text / Promotion"
              value={discountText}
              setValue={setDiscountText}
              placeholder="Up to 30% OFF"
            />

            <label style={styles.checkRow}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Visible to users
            </label>

            {imageUrl && (
              <div style={styles.previewBox}>
                <img src={imageUrl} alt="Preview" style={styles.previewImg} />

                <div style={styles.previewOverlay}>
                  {discountText && (
                    <span style={styles.discountPreview}>{discountText}</span>
                  )}
                  <h3>{title || "Slide Title"}</h3>
                  <p>{subtitle || "Slide subtitle preview"}</p>
                </div>
              </div>
            )}

            <button type="submit" disabled={saving} style={styles.saveBtn}>
              {saving ? "Saving..." : editingId ? "Update Slide" : "Add Slide"}
            </button>

            {editingId && (
              <button type="button" onClick={clearForm} style={styles.cancelBtn}>
                Cancel Edit
              </button>
            )}
          </form>
        </aside>

        <section style={styles.listPanel}>
          <div style={styles.listTop}>
            <div>
              <h2 style={styles.listTitle}>All Slides</h2>
              <p style={styles.listSub}>
                Choose one main active slide for dashboard hero.
              </p>
            </div>

            <div style={styles.topActions}>
              <button
                type="button"
                onClick={() => loadSlides({ silent: true })}
                style={styles.refreshBtn}
              >
                <RefreshCw size={16} />
                Refresh
              </button>

              <span style={styles.countPill}>{slides.length} Slides</span>
            </div>
          </div>

          <div style={styles.searchBox}>
            <Search size={18} color="#71717a" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search slides..."
              style={styles.searchInput}
            />
          </div>

          {loading ? (
            <AdminSkeleton cards={4} rows={4} />
          ) : filteredSlides.length === 0 ? (
            <div style={styles.emptyBox}>
              <h3>{slides.length === 0 ? "No slides yet" : "No slides found"}</h3>
              <p>
                {slides.length === 0
                  ? "Add your first slide from the left form."
                  : "Try another search term."}
              </p>
              {slides.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={styles.clearBtn}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div style={styles.slidesGrid}>
              {filteredSlides.map((slide) => (
                <article key={slide.id} style={styles.slideCard}>
                  <div style={styles.slideImageBox}>
                    <img
                      src={slide.image_url || "/images/classic-shoes.webp"}
                      alt={slide.title}
                      style={styles.slideImage}
                    />

                    <div style={styles.slideBadges}>
                      {slide.is_active === false ? (
                        <span style={styles.hiddenBadge}>HIDDEN</span>
                      ) : (
                        <span style={styles.showBadge}>SHOW</span>
                      )}

                      {activeHero?.id === slide.id && (
                        <span style={styles.activeBadge}>MAIN HERO</span>
                      )}
                    </div>

                    {slide.discount_text && (
                      <span style={styles.discountBadge}>{slide.discount_text}</span>
                    )}
                  </div>

                  <div style={styles.slideBody}>
                    <p style={styles.slideCategory}>
                      {slide.category || "New Dubai"}
                    </p>

                    <h3 style={styles.slideTitle}>{slide.title}</h3>
                    <p style={styles.slideSubtitle}>{slide.subtitle}</p>

                    <div style={styles.actions}>
                      <button
                        type="button"
                        onClick={() => setMainSlide(slide.id)}
                        style={styles.activeBtn}
                      >
                        <Star size={15} />
                        Set Active
                      </button>

                      <button
                        type="button"
                        onClick={() => editSlide(slide)}
                        style={styles.editBtn}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleVisible(slide)}
                        style={styles.showBtn}
                      >
                        {slide.is_active === false ? (
                          <>
                            <Eye size={15} />
                            Show
                          </>
                        ) : (
                          <>
                            <EyeOff size={15} />
                            Hide
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSlide(slide)}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Field({ label, value, setValue, placeholder }) {
  return (
    <>
      <label style={styles.label}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={styles.input}
      />
    </>
  );
}

function Stat({ title, value }) {
  return (
    <div style={styles.stat}>
      <p style={styles.statTitle}>{title}</p>
      <h3 style={styles.statValue}>{value}</h3>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f5f7",
    padding: "22px",
    fontFamily: "Arial, sans-serif",
    color: "#111",
    boxSizing: "border-box",
  },
  header: {
    background:
      "radial-gradient(circle at top left, rgba(245,164,0,0.20), transparent 35%), #070707",
    color: "#fff",
    borderRadius: "28px",
    padding: "26px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    boxShadow: "0 20px 45px rgba(0,0,0,0.28)",
  },
  badge: {
    display: "inline-block",
    margin: "0 0 10px",
    background: "rgba(245, 158, 11, 0.15)",
    color: "#f5a400",
    border: "1px solid rgba(245, 158, 11, 0.4)",
    borderRadius: "999px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: "900",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "900",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#aaa",
    fontSize: "14px",
    fontWeight: "700",
  },
  backHome: {
    marginTop: "16px",
    height: "44px",
    padding: "0 18px",
    borderRadius: "15px",
    background: "#f5a400",
    color: "#000",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "900",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 140px)",
    gap: "12px",
  },
  stat: {
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "20px",
    padding: "15px",
  },
  statTitle: {
    color: "#bbb",
    fontSize: "12px",
    fontWeight: "800",
    margin: "0 0 6px",
  },
  statValue: {
    color: "#fff",
    fontSize: "22px",
    fontWeight: "900",
    margin: 0,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "390px minmax(0, 1fr)",
    gap: "18px",
    alignItems: "start",
  },
  formPanel: {
    background: "#070707",
    color: "#fff",
    borderRadius: "26px",
    padding: "22px",
    maxHeight: "calc(100vh - 150px)",
    overflowY: "auto",
    boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
    boxSizing: "border-box",
    position: "sticky",
    top: "18px",
  },
  formHead: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },
  iconBox: {
    width: "48px",
    height: "48px",
    background: "#f5a400",
    color: "#000",
    borderRadius: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  formTitle: {
    margin: 0,
    fontSize: "23px",
    fontWeight: "900",
  },
  formSub: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#aaa",
    fontWeight: "700",
  },
  message: {
    background: "rgba(245, 158, 11, 0.14)",
    color: "#fbbf24",
    border: "1px solid rgba(245, 158, 11, 0.35)",
    borderRadius: "15px",
    padding: "12px",
    marginBottom: "14px",
    fontSize: "13px",
    fontWeight: "800",
  },
  label: {
    display: "block",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "900",
    marginBottom: "7px",
    marginTop: "13px",
  },
  input: {
    width: "100%",
    height: "46px",
    borderRadius: "15px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#151515",
    color: "#fff",
    padding: "0 14px",
    fontSize: "14px",
    fontWeight: "700",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: "105px",
    borderRadius: "15px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#151515",
    color: "#fff",
    padding: "14px",
    fontSize: "14px",
    fontWeight: "700",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    marginTop: "14px",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "900",
  },
  previewBox: {
    marginTop: "16px",
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid rgba(245,164,0,0.25)",
    background: "#111",
    height: "190px",
    position: "relative",
  },
  previewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.55,
  },
  previewOverlay: {
    position: "absolute",
    inset: 0,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    color: "#fff",
  },
  discountPreview: {
    alignSelf: "flex-start",
    background: "#f5a400",
    color: "#000",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "8px",
  },
  saveBtn: {
    width: "100%",
    height: "50px",
    border: "none",
    borderRadius: "17px",
    background: "#f5a400",
    color: "#000",
    fontSize: "15px",
    fontWeight: "900",
    marginTop: "18px",
    cursor: "pointer",
  },
  cancelBtn: {
    width: "100%",
    height: "44px",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "16px",
    background: "transparent",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "900",
    marginTop: "10px",
    cursor: "pointer",
  },
  listPanel: {
    background: "#fff",
    borderRadius: "26px",
    padding: "22px",
    minHeight: "calc(100vh - 150px)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.10)",
    boxSizing: "border-box",
    border: "1px solid #e5e7eb",
  },
  listTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    marginBottom: "18px",
  },
  topActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  refreshBtn: {
    height: "42px",
    border: "none",
    borderRadius: "14px",
    background: "#070707",
    color: "#f5a400",
    padding: "0 16px",
    fontWeight: "900",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  listTitle: {
    margin: 0,
    fontSize: "25px",
    fontWeight: "900",
  },
  listSub: {
    margin: "5px 0 0",
    color: "#666",
    fontSize: "13px",
    fontWeight: "700",
  },
  countPill: {
    background: "#070707",
    color: "#f5a400",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },
  searchBox: {
    height: "46px",
    borderRadius: "15px",
    border: "1px solid #ddd",
    background: "#f8f8f8",
    padding: "0 14px",
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    boxSizing: "border-box",
  },
  searchInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    fontWeight: "700",
    outline: "none",
    color: "#111",
  },
  emptyBox: {
    height: "360px",
    border: "1px dashed #ccc",
    borderRadius: "22px",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#444",
    textAlign: "center",
    padding: "18px",
  },
  clearBtn: {
    marginTop: "12px",
    border: "none",
    borderRadius: "14px",
    background: "#070707",
    color: "#f5a400",
    padding: "11px 16px",
    fontSize: "13px",
    fontWeight: "900",
    cursor: "pointer",
  },
  slidesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
    gap: "18px",
  },
  slideCard: {
    border: "1px solid #eeeeee",
    background: "#fafafa",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  },
  slideImageBox: {
    height: "210px",
    position: "relative",
    background: "#111",
  },
  slideImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  slideBadges: {
    position: "absolute",
    top: "14px",
    left: "14px",
    right: "14px",
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
  },
  hiddenBadge: {
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "999px",
    padding: "7px 11px",
    fontSize: "11px",
    fontWeight: "900",
  },
  showBadge: {
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "999px",
    padding: "7px 11px",
    fontSize: "11px",
    fontWeight: "900",
  },
  activeBadge: {
    background: "#f5a400",
    color: "#000",
    borderRadius: "999px",
    padding: "7px 11px",
    fontSize: "11px",
    fontWeight: "900",
  },
  discountBadge: {
    position: "absolute",
    bottom: "14px",
    left: "14px",
    background: "#f5a400",
    color: "#000",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: "900",
    boxShadow: "0 12px 25px rgba(0,0,0,0.25)",
  },
  slideBody: {
    padding: "17px",
  },
  slideCategory: {
    margin: 0,
    color: "#b45309",
    fontSize: "12px",
    fontWeight: "900",
  },
  slideTitle: {
    margin: "6px 0 0",
    fontSize: "22px",
    fontWeight: "900",
    color: "#111",
  },
  slideSubtitle: {
    margin: "7px 0 0",
    color: "#555",
    fontSize: "13px",
    lineHeight: "20px",
    fontWeight: "700",
  },
  actions: {
    marginTop: "16px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "9px",
  },
  activeBtn: {
    border: "none",
    background: "#f5a400",
    color: "#000",
    borderRadius: "13px",
    padding: "11px",
    fontWeight: "900",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
  },
  editBtn: {
    border: "none",
    background: "#070707",
    color: "#f5a400",
    borderRadius: "13px",
    padding: "11px",
    fontWeight: "900",
    cursor: "pointer",
  },
  showBtn: {
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    borderRadius: "13px",
    padding: "11px",
    fontWeight: "900",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
  },
  deleteBtn: {
    border: "1px solid #fecaca",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "13px",
    padding: "11px",
    fontWeight: "900",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
  },
};
