"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import {
  confirmDialog,
  handleSessionExpiry,
  showToast,
  useDebouncedValue,
  useSmartRefetch,
} from "@/lib/adminUi";
import AdminSkeleton from "@/components/admin-skeleton";

export default function ProductsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const categories = ["Clothes", "Shoes", "Perfume", "Accessories"];

  const [products, setProducts] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Clothes");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageInputKey, setImageInputKey] = useState(0);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const fetchProducts = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      if (silent) setRefreshing(true);

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
        setRefreshing(false);
        return;
      }

      const response = await fetch("/api/admin/products");
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(result.error || "Products lama soo qaadi karin.");
        error.status = response.status;
        const handled = await handleSessionExpiry(error, router);
        if (!handled) {
          console.log(error);
          setMessage(error.message || "Products lama soo qaadi karin.");
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setProducts(result.products || []);
      setLoading(false);
      setRefreshing(false);
    },
    [router, supabase]
  );

  useEffect(() => {
    Promise.resolve().then(() => fetchProducts());
  }, [fetchProducts]);

  useSmartRefetch(fetchProducts);

  function clearForm() {
    setName("");
    setPrice("");
    setCategory("Clothes");
    setStock("");
    setImageUrl("");
    setSelectedImageFile(null);
    setImagePreviewUrl("");
    setImageInputKey((key) => key + 1);
    setEditingId(null);
  }

  function editProduct(product) {
    setEditingId(product.id);
    setName(product.name || "");
    setPrice(product.price || "");
    setCategory(product.category || "Clothes");
    setStock(product.stock || "");
    setImageUrl(product.image_url || "");
    setSelectedImageFile(null);
    setImagePreviewUrl(product.image_url || "");
    setImageInputKey((key) => key + 1);
    setMessage("");
  }

  async function uploadProductImage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/product-image-upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(result.error || "Image upload ma shaqayn.");
      error.status = response.status;
      throw error;
    }

    return result.url;
  }

  async function saveProductToServer(payload, id = null) {
    const response = await fetch("/api/admin/products", {
      method: id ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(id ? { id, ...payload } : payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(result.error || "Product save ma shaqayn.");
      error.status = response.status;
      throw error;
    }

    return result.product;
  }

  async function deleteProductFromServer(id) {
    const response = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(result.error || "Delete ma shaqayn.");
      error.status = response.status;
      throw error;
    }
  }

  async function saveProduct(e) {
    e.preventDefault();
    setMessage("");

    if (!name || !price || !category || !stock || (!imageUrl && !selectedImageFile)) {
      setMessage("Fadlan buuxi Product Name, Price, Category, Stock iyo Image.");
      return;
    }

    setSaving(true);

    let uploadedImageUrl = imageUrl.trim();

    try {
      if (selectedImageFile) {
        uploadedImageUrl = await uploadProductImage(selectedImageFile);
      }
    } catch (error) {
      console.log(error);
      setMessage(error.message || "Image upload ma shaqayn.");
      setSaving(false);
      return;
    }

    const payload = {
      name: name.trim(),
      price: Number(price),
      category,
      stock: Number(stock),
      image_url: uploadedImageUrl,
    };

    if (editingId) {
      const previousProducts = products;
      const optimisticProduct = {
        ...products.find((product) => product.id === editingId),
        ...payload,
        id: editingId,
      };

      setProducts((prev) =>
        prev.map((product) =>
          product.id === editingId ? optimisticProduct : product
        )
      );

      try {
        const data = await saveProductToServer(payload, editingId);

        setProducts((prev) =>
          prev.map((product) => (product.id === editingId ? data : product))
        );
        setMessage("Product si dhab ah ayaa loo update gareeyay.");
        showToast("Product updated.");
        clearForm();
      } catch (error) {
        setProducts(previousProducts);
        const handled = await handleSessionExpiry(error, router);
        if (!handled) {
          console.log(error);
          setMessage(error.message || "Update ma shaqayn.");
        }
      }
    } else {
      const tempId = `temp-${Date.now()}`;
      const optimisticProduct = {
        id: tempId,
        ...payload,
        created_at: new Date().toISOString(),
      };

      setProducts((prev) => [optimisticProduct, ...prev]);

      try {
        const data = await saveProductToServer(payload);

        setProducts((prev) =>
          prev.map((product) => (product.id === tempId ? data : product))
        );
        setMessage("Product waa la daray.");
        showToast("Product added.");
        clearForm();
      } catch (error) {
        setProducts((prev) => prev.filter((product) => product.id !== tempId));
        const handled = await handleSessionExpiry(error, router);
        if (!handled) {
          console.log(error);
          setMessage(error.message || "Database error. Hubi products table.");
        }
      }
    }

    setSaving(false);
  }

  async function deleteProduct(id) {
    const product = products.find((item) => item.id === id);
    const ok = await confirmDialog({
      title: "Delete product?",
      text: `Ma hubtaa inaad delete gareyneyso "${
        product?.name || "product-kan"
      }"?`,
      confirmButtonText: "Delete",
    });
    if (!ok) return;

    const previousProducts = products;
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      await deleteProductFromServer(id);
    } catch (error) {
      setProducts(previousProducts);
      const handled = await handleSessionExpiry(error, router);
      if (!handled) {
        console.log(error);
        setMessage(error.message || "Delete ma shaqayn.");
      }
      return;
    }

    setMessage("Product waa la delete gareeyay.");
    showToast("Product deleted.");
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchText = debouncedSearch.trim().toLowerCase();
      const productName = (product.name || "").toLowerCase();
      const productCategory = (product.category || "").trim().toLowerCase();
      const activeCategory = categoryFilter.trim().toLowerCase();

      const matchesSearch =
        searchText === "" ||
        productName.includes(searchText) ||
        productCategory.includes(searchText);

      const matchesCategory =
        activeCategory === "all" || productCategory === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedSearch, categoryFilter]);

  const totalProducts = products.length;
  const lowStock = products.filter(
    (p) => Number(p.stock) > 0 && Number(p.stock) <= 5
  ).length;
  const outStock = products.filter((p) => Number(p.stock) <= 0).length;
  const value = products.reduce(
    (sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0),
    0
  );

  return (
    <main className="admin-products-page responsive-admin-page" style={styles.page}>
      <section style={styles.header}>
        <div>
          <div style={styles.badge}>NEW DUBAI ADMIN SYSTEM</div>
          <h1 style={styles.title}>Products Management</h1>
          <p style={styles.subtitle}>Add, edit, delete and manage products.</p>

          <Link href="/admin" style={styles.backHome}>
            ← Back Home
          </Link>
        </div>

        <div className="responsive-stats-grid" style={styles.statsGrid}>
          <Stat title="Products" value={totalProducts} />
          <Stat title="Low Stock" value={lowStock} />
          <Stat title="Out" value={outStock} />
          <Stat title="Value" value={`$${value.toFixed(2)}`} />
        </div>
      </section>

      <section className="responsive-split-layout" style={styles.layout}>
        <aside style={styles.formPanel}>
          <div style={styles.formHead}>
            <div style={styles.iconBox}>＋</div>
            <div>
              <h2 style={styles.formTitle}>
                {editingId ? "Edit Product" : "Add Product"}
              </h2>
              <p style={styles.formSub}>Product details</p>
            </div>
          </div>

          {message && <div style={styles.message}>{message}</div>}

          <form onSubmit={saveProduct}>
            <Field
              label="Product Name"
              value={name}
              setValue={setName}
              placeholder="Classic Black Shirt"
            />

            <Field
              label="Price"
              type="number"
              value={price}
              setValue={setPrice}
              placeholder="20.99"
            />

            <label style={styles.label}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.input}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <Field
              label="Stock"
              type="number"
              value={stock}
              setValue={setStock}
              placeholder="10"
            />

            <label style={styles.label}>Image URL / Path</label>
            <input
              key={imageInputKey}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSelectedImageFile(file);
                setImagePreviewUrl(URL.createObjectURL(file));
                setImageUrl("");
              }}
              style={styles.input}
            />

            {(imagePreviewUrl || imageUrl) && (
              <div style={styles.previewBox}>
                <img
                  src={imagePreviewUrl || imageUrl}
                  alt="Preview"
                  style={styles.previewImg}
                />
              </div>
            )}

            <button type="submit" disabled={saving} style={styles.saveBtn}>
              {saving
                ? "Saving..."
                : editingId
                ? "Update Product"
                : "Add Product"}
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
              <h2 style={styles.listTitle}>Product Inventory</h2>
              <p style={styles.listSub}>
                Showing {filteredProducts.length} of {products.length} products.
              </p>
            </div>

            <div style={styles.filters}>
              <button
                type="button"
                onClick={() => fetchProducts({ silent: true })}
                style={styles.refreshBtn}
              >
                <RefreshCw size={16} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product..."
                style={styles.searchInput}
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <AdminSkeleton />
          ) : filteredProducts.length === 0 ? (
            <div style={styles.emptyBox}>
              <h3>{products.length === 0 ? "No products yet" : "No products found"}</h3>
              <p>
                {products.length === 0
                  ? "Add your first product from the left side form."
                  : "Try another search term or category filter."}
              </p>
              {products.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("All");
                  }}
                  style={styles.clearBtn}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="responsive-table-wrap" style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Stock</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.thRight}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => {
                    const stockNumber = Number(product.stock || 0);
                    const status =
                      stockNumber <= 0
                        ? "Out of Stock"
                        : stockNumber <= 5
                        ? "Low Stock"
                        : "In Stock";

                    return (
                      <tr key={product.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.productCell}>
                            <img
                              src={
                                product.image_url ||
                                "/images/placeholder.png"
                              }
                              alt={product.name}
                              style={styles.productImg}
                            />
                            <div>
                              <strong>{product.name}</strong>
                              <p style={styles.idText}>
                                ID: {String(product.id).slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td style={styles.td}>
                          <span style={styles.catPill}>{product.category}</span>
                        </td>

                        <td style={styles.td}>${product.price}</td>
                        <td style={styles.td}>{product.stock}</td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.status,
                              background:
                                status === "In Stock"
                                  ? "#dcfce7"
                                  : status === "Low Stock"
                                  ? "#ffedd5"
                                  : "#fee2e2",
                              color:
                                status === "In Stock"
                                  ? "#166534"
                                  : status === "Low Stock"
                                  ? "#9a3412"
                                  : "#991b1b",
                            }}
                          >
                            {status}
                          </span>
                        </td>

                        <td style={styles.tdRight}>
                          <button
                            onClick={() => editProduct(product)}
                            style={styles.editBtn}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteProduct(product.id)}
                            style={styles.deleteBtn}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Field({ label, value, setValue, placeholder, type = "text" }) {
  return (
    <>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
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
    padding: "18px",
    fontFamily: "Arial, sans-serif",
    color: "#111",
    boxSizing: "border-box",
  },
  header: {
    background: "#070707",
    color: "#fff",
    borderRadius: "24px",
    padding: "22px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
  },
  badge: {
    display: "inline-block",
    background: "rgba(245, 158, 11, 0.15)",
    color: "#f5a400",
    border: "1px solid rgba(245, 158, 11, 0.4)",
    borderRadius: "999px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "10px",
  },
  backHome: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "16px",
    height: "42px",
    padding: "0 18px",
    borderRadius: "14px",
    background: "#f5a400",
    color: "#000",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "900",
    boxShadow: "0 10px 22px rgba(245,164,0,0.25)",
  },
  title: {
    fontSize: "30px",
    fontWeight: "900",
    margin: "0",
  },
  subtitle: {
    color: "#aaa",
    margin: "6px 0 0",
    fontSize: "14px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 120px)",
    gap: "10px",
  },
  stat: {
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "14px",
  },
  statTitle: {
    color: "#bbb",
    fontSize: "12px",
    fontWeight: "800",
    margin: "0 0 8px",
  },
  statValue: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "900",
    margin: "0",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "390px 1fr",
    gap: "18px",
    alignItems: "start",
  },
  formPanel: {
    background: "#070707",
    color: "#fff",
    borderRadius: "24px",
    padding: "22px",
    height: "calc(100vh - 160px)",
    overflowY: "auto",
    boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
    boxSizing: "border-box",
  },
  formHead: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },
  iconBox: {
    width: "46px",
    height: "46px",
    background: "#f5a400",
    color: "#000",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: "900",
  },
  formTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "900",
  },
  formSub: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#aaa",
  },
  message: {
    background: "rgba(245, 158, 11, 0.14)",
    color: "#fbbf24",
    border: "1px solid rgba(245, 158, 11, 0.35)",
    borderRadius: "14px",
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
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#151515",
    color: "#fff",
    padding: "0 14px",
    fontSize: "14px",
    fontWeight: "700",
    outline: "none",
    boxSizing: "border-box",
  },
  previewBox: {
    marginTop: "14px",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
    height: "145px",
    background: "#111",
  },
  previewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  saveBtn: {
    width: "100%",
    height: "48px",
    border: "none",
    borderRadius: "16px",
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
    borderRadius: "24px",
    padding: "22px",
    height: "calc(100vh - 160px)",
    overflowY: "auto",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    boxSizing: "border-box",
  },
  listTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    marginBottom: "18px",
  },
  listTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "900",
  },
  listSub: {
    margin: "5px 0 0",
    color: "#666",
    fontSize: "13px",
  },
  filters: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  refreshBtn: {
    height: "44px",
    border: "none",
    borderRadius: "14px",
    background: "#070707",
    color: "#f5a400",
    padding: "0 14px",
    fontWeight: "900",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
  },
  searchInput: {
    height: "44px",
    width: "230px",
    borderRadius: "14px",
    border: "1px solid #ddd",
    background: "#f8f8f8",
    padding: "0 14px",
    fontWeight: "700",
    outline: "none",
  },
  filterSelect: {
    height: "44px",
    borderRadius: "14px",
    border: "1px solid #ddd",
    background: "#f8f8f8",
    padding: "0 14px",
    fontWeight: "800",
    outline: "none",
  },
  emptyBox: {
    height: "360px",
    border: "1px dashed #ccc",
    borderRadius: "20px",
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
  tableWrap: {
    overflowX: "auto",
    borderRadius: "18px",
    border: "1px solid #e5e5e5",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "850px",
  },
  th: {
    background: "#070707",
    color: "#f5a400",
    padding: "14px",
    fontSize: "12px",
    textTransform: "uppercase",
    fontWeight: "900",
  },
  thRight: {
    background: "#070707",
    color: "#f5a400",
    padding: "14px",
    fontSize: "12px",
    textTransform: "uppercase",
    fontWeight: "900",
    textAlign: "right",
  },
  tr: {
    borderBottom: "1px solid #eee",
  },
  td: {
    padding: "14px",
    fontSize: "14px",
    fontWeight: "700",
    verticalAlign: "middle",
  },
  tdRight: {
    padding: "14px",
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  productCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  productImg: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    objectFit: "cover",
    background: "#eee",
  },
  idText: {
    margin: "4px 0 0",
    fontSize: "11px",
    color: "#777",
  },
  catPill: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
  },
  status: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
  },
  editBtn: {
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    borderRadius: "12px",
    padding: "9px 12px",
    fontWeight: "900",
    marginRight: "8px",
    cursor: "pointer",
  },
  deleteBtn: {
    border: "1px solid #fecaca",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "12px",
    padding: "9px 12px",
    fontWeight: "900",
    cursor: "pointer",
  },
};
