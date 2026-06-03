"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FolderPlus,
  Trash2,
  Tag,
  Search,
  RefreshCw,
  Layers3,
  Package,
  Boxes,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import {
  confirmDialog,
  handleSessionExpiry,
  showToast,
  useDebouncedValue,
  useSmartRefetch,
} from "@/lib/adminUi";
import AdminSkeleton from "@/components/admin-skeleton";

const defaultIcons = {
  Clothes: "👕",
  Shoes: "👞",
  Perfume: "🧴",
  Accessories: "⌚",
};

export default function AdminCategoriesPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setMessage("");
      }

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

      const [categoriesResult, productsResult] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("products").select("id, category, stock"),
      ]);

      const { data: categoriesData, error: categoriesError } = categoriesResult;
      const { data: productsData, error: productsError } = productsResult;

      if (categoriesError || productsError) {
        const error = categoriesError || productsError;
        const handled = await handleSessionExpiry(error, router);
        if (!handled) {
          setMessage("Categories lama soo qaadi karin: " + error.message);
        }
        setLoading(false);
        return;
      }

      setCategories(categoriesData || []);
      setProducts(productsData || []);
      setLoading(false);
    },
    [router, supabase]
  );

  useEffect(() => {
    Promise.resolve().then(() => loadData());
  }, [loadData]);

  useSmartRefetch(loadData);

  function clearForm() {
    setName("");
    setIcon("");
    setDescription("");
    setEditingId(null);
  }

  function editCategory(category) {
    setEditingId(category.id);
    setName(category.name || "");
    setIcon(category.icon || defaultIcons[category.name] || "");
    setDescription(category.description || "");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveCategory(e) {
    e.preventDefault();
    setMessage("");

    const cleanName = name.trim();
    const cleanIcon = icon.trim() || defaultIcons[cleanName] || "🏷️";
    const cleanDescription =
      description.trim() ||
      `Products related to ${cleanName} collection in New Dubai Fashion Style.`;

    if (!cleanName) {
      setMessage("Fadlan geli category name.");
      return;
    }

    const duplicate = categories.find(
      (category) =>
        category.name?.toLowerCase() === cleanName.toLowerCase() &&
        category.id !== editingId
    );

    if (duplicate) {
      setMessage("Category-kan hore ayuu u jiray. Magac kale geli.");
      return;
    }

    setSaving(true);

    const payload = {
      name: cleanName,
      icon: cleanIcon,
      description: cleanDescription,
    };

    if (editingId) {
      const previousCategories = categories;
      setCategories((prev) =>
        prev.map((category) =>
          category.id === editingId ? { ...category, ...payload } : category
        )
      );

      const { data, error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();

      if (error) {
        setCategories(previousCategories);
        const handled = await handleSessionExpiry(error, router);
        if (!handled) setMessage("Category update ma shaqayn: " + error.message);
        setSaving(false);
        return;
      }

      setCategories((prev) =>
        prev.map((category) => (category.id === editingId ? data : category))
      );

      setMessage("Category si sax ah ayaa loo update gareeyay.");
      showToast("Category updated.");
      clearForm();
      setSaving(false);
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticCategory = {
      id: tempId,
      ...payload,
      created_at: new Date().toISOString(),
    };

    setCategories((prev) => [optimisticCategory, ...prev]);
    clearForm();

    const { data, error } = await supabase
      .from("categories")
      .insert([payload])
      .select()
      .single();

    if (error) {
      setCategories((prev) => prev.filter((category) => category.id !== tempId));
      const handled = await handleSessionExpiry(error, router);
      if (!handled) setMessage("Category lama darin: " + error.message);
      setSaving(false);
      return;
    }

    setCategories((prev) =>
      prev.map((category) => (category.id === tempId ? data : category))
    );
    setMessage("Category cusub waa la daray.");
    showToast("Category added.");
    setSaving(false);
  }

  async function handleDeleteCategory(category) {
    const productCount = getProductCount(category.name);

    const ok = await confirmDialog({
      title: "Delete category?",
      text:
        productCount > 0
          ? `"${category.name}" category waxaa ku jira ${productCount} product. Products-ka ma tirmayaan, laakiin filter-ka category-gaas wuu ka baxayaa.`
          : `Category-kan "${category.name}" ma delete gareynaa?`,
      confirmButtonText: "Delete",
    });

    if (!ok) return;

    const previousCategories = categories;
    setCategories((prev) => prev.filter((item) => item.id !== category.id));

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      setCategories(previousCategories);
      const handled = await handleSessionExpiry(error, router);
      if (!handled) setMessage("Delete ma shaqayn: " + error.message);
      return;
    }

    setMessage("Category waa la delete gareeyay.");
    showToast("Category deleted.");
  }

  function getProductCount(categoryName) {
    return products.filter(
      (product) =>
        (product.category || "").toLowerCase() ===
        (categoryName || "").toLowerCase()
    ).length;
  }

  function getStockCount(categoryName) {
    return products
      .filter(
        (product) =>
          (product.category || "").toLowerCase() ===
          (categoryName || "").toLowerCase()
      )
      .reduce((sum, product) => sum + Number(product.stock || 0), 0);
  }

  const filteredCategories = useMemo(() => {
    const text = debouncedSearch.trim().toLowerCase();

    return categories.filter((category) => {
      if (!text) return true;

      return (
        category.name?.toLowerCase().includes(text) ||
        category.description?.toLowerCase().includes(text)
      );
    });
  }, [categories, debouncedSearch]);

  const totalProductsLinked = categories.reduce(
    (sum, category) => sum + getProductCount(category.name),
    0
  );

  const emptyCategories = categories.filter(
    (category) => getProductCount(category.name) === 0
  ).length;

  return (
    <main className="admin-categories-page responsive-admin-page" style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.badge}>NEW DUBAI ADMIN SYSTEM</p>
          <h1 style={styles.title}>Product Categories</h1>
          <p style={styles.subtitle}>
            Manage category filters that appear on the customer dashboard.
          </p>

          <Link href="/admin" style={styles.backHome}>
            <ArrowLeft size={18} />
            Back Home
          </Link>
        </div>

        <div className="responsive-stats-grid" style={styles.statsGrid}>
          <Stat icon={<Layers3 size={22} />} title="Categories" value={categories.length} />
          <Stat icon={<Package size={22} />} title="Linked Products" value={totalProductsLinked} />
          <Stat icon={<Boxes size={22} />} title="Empty Groups" value={emptyCategories} />
        </div>
      </section>

      <section className="responsive-split-layout" style={styles.layout}>
        <aside style={styles.formPanel}>
          <div style={styles.formHead}>
            <div style={styles.iconBox}>{editingId ? "✎" : "＋"}</div>

            <div>
              <h2 style={styles.formTitle}>
                {editingId ? "Edit Category" : "Add Category"}
              </h2>
              <p style={styles.formSub}>Dashboard filter group</p>
            </div>
          </div>

          {message && <div style={styles.message}>{message}</div>}

          <form onSubmit={handleSaveCategory}>
            <Field
              label="Category Name"
              value={name}
              setValue={setName}
              placeholder="Clothes"
            />

            <Field
              label="Icon / Emoji"
              value={icon}
              setValue={setIcon}
              placeholder="👕"
            />

            <label style={styles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Men clothes collection for New Dubai Fashion Style."
              style={styles.textarea}
            />

            <div style={styles.quickIcons}>
              {[
                ["👕", "Clothes"],
                ["👞", "Shoes"],
                ["🧴", "Perfume"],
                ["⌚", "Accessories"],
                ["🕶️", "Fashion"],
                ["💎", "Premium"],
              ].map(([emoji, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  style={styles.quickIconBtn}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>

            <div style={styles.previewBox}>
              <div style={styles.previewIcon}>{icon || "🏷️"}</div>

              <div>
                <h3 style={styles.previewTitle}>{name || "Category Name"}</h3>
                <p style={styles.previewText}>
                  {description || "Category description preview."}
                </p>
              </div>
            </div>

            <button type="submit" disabled={saving} style={styles.saveBtn}>
              <FolderPlus size={18} />
              {saving
                ? "Saving..."
                : editingId
                ? "Update Category"
                : "Add Category"}
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
              <h2 style={styles.listTitle}>All Categories</h2>
              <p style={styles.listSub}>
                Search, edit, delete and monitor category usage.
              </p>
            </div>

            <button type="button" onClick={loadData} style={styles.refreshBtn}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div style={styles.searchBox}>
            <Search size={18} color="#71717a" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category..."
              style={styles.searchInput}
            />
          </div>

          {loading ? (
            <AdminSkeleton cards={4} rows={4} />
          ) : filteredCategories.length === 0 ? (
            <div style={styles.emptyBox}>
              <h3>
                {categories.length === 0 ? "No categories yet" : "No categories found"}
              </h3>
              <p>
                {categories.length === 0
                  ? "Add your first category from the left side form."
                  : "Try another search term."}
              </p>
              {categories.length > 0 && (
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
            <div style={styles.cardsGrid}>
              {filteredCategories.map((category) => {
                const productCount = getProductCount(category.name);
                const stockCount = getStockCount(category.name);

                return (
                  <article key={category.id} style={styles.card}>
                    <div style={styles.cardTop}>
                      <div style={styles.cardIcon}>
                        {category.icon || defaultIcons[category.name] || "🏷️"}
                      </div>

                      <span
                        style={{
                          ...styles.statusPill,
                          background: productCount > 0 ? "#dcfce7" : "#ffedd5",
                          color: productCount > 0 ? "#166534" : "#9a3412",
                        }}
                      >
                        {productCount > 0 ? "Active" : "Empty"}
                      </span>
                    </div>

                    <h3 style={styles.cardTitle}>{category.name}</h3>

                    <p style={styles.cardText}>
                      {category.description ||
                        "No description added for this category."}
                    </p>

                    <div style={styles.miniStats}>
                      <div style={styles.miniStat}>
                        <span>Products</span>
                        <strong>{productCount}</strong>
                      </div>

                      <div style={styles.miniStat}>
                        <span>Total Stock</span>
                        <strong>{stockCount}</strong>
                      </div>
                    </div>

                    <p style={styles.idText}>
                      ID: {String(category.id).slice(0, 8)}
                    </p>

                    <div style={styles.actions}>
                      <button
                        type="button"
                        onClick={() => editCategory(category)}
                        style={styles.editBtn}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category)}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Field({ label, value, setValue, placeholder }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputWrap}>
        <Tag size={17} color="#a1a1aa" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          style={styles.input}
        />
      </div>
    </div>
  );
}

function Stat({ icon, title, value }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statIcon}>{icon}</div>
      <div>
        <p style={styles.statTitle}>{title}</p>
        <h3 style={styles.statValue}>{value}</h3>
      </div>
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
    gridTemplateColumns: "repeat(3, 170px)",
    gap: "12px",
    alignContent: "start",
  },

  stat: {
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "20px",
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  statIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "15px",
    background: "#f5a400",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
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
    gridTemplateColumns: "380px minmax(0, 1fr)",
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
    fontSize: "25px",
    fontWeight: "900",
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

  inputWrap: {
    height: "46px",
    borderRadius: "15px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#151515",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "0 14px",
    boxSizing: "border-box",
  },

  input: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "700",
    outline: "none",
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

  quickIcons: {
    marginTop: "14px",
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
  },

  quickIconBtn: {
    height: "38px",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "13px",
    background: "#151515",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    fontSize: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },

  previewBox: {
    marginTop: "16px",
    borderRadius: "18px",
    border: "1px solid rgba(245,164,0,0.25)",
    background: "rgba(245,164,0,0.10)",
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  previewIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#f5a400",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "900",
    flexShrink: 0,
  },

  previewTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "18px",
    fontWeight: "900",
  },

  previewText: {
    margin: "5px 0 0",
    color: "#bdbdbd",
    fontSize: "12px",
    lineHeight: "18px",
    fontWeight: "700",
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
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
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
    marginBottom: "14px",
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

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },

  card: {
    border: "1px solid #eeeeee",
    background: "#fafafa",
    borderRadius: "22px",
    padding: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },

  cardIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "#070707",
    color: "#f5a400",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    fontWeight: "900",
  },

  statusPill: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
  },

  cardTitle: {
    margin: 0,
    color: "#111",
    fontSize: "21px",
    fontWeight: "900",
  },

  cardText: {
    margin: "9px 0 0",
    color: "#555",
    fontSize: "13px",
    lineHeight: "20px",
    fontWeight: "700",
    minHeight: "40px",
  },

  miniStats: {
    marginTop: "14px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  miniStat: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: "16px",
    padding: "11px",
    display: "grid",
    gap: "5px",
  },

  idText: {
    margin: "12px 0 0",
    fontSize: "11px",
    color: "#777",
    fontWeight: "700",
  },

  actions: {
    marginTop: "16px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "9px",
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
