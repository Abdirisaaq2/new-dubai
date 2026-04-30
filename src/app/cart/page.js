"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  ShoppingCart,
  CheckCircle,
  PackageCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { confirmDialog, showToast } from "@/lib/adminUi";

export default function CartPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);

  async function loadCart() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    const { data: cartData, error: cartError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id);

    if (cartError || !cartData || cartData.length === 0) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    const productIds = cartData.map((i) => i.product_id).filter(Boolean);

    const { data: products } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    const map = new Map((products || []).map((p) => [p.id, p]));

    const merged = cartData.map((item) => {
      const p = map.get(item.product_id);

      return {
        ...item,
        product_name: p?.name || "Product",
        price: Number(p?.price || 0),
        image_url: p?.image_url || "/images/t-shirts.jpg",
        category: p?.category || "Fashion",
        stock: Number(p?.stock || 10),
        discount: Number(p?.discount || 0),
      };
    });

    setCartItems(merged);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCart();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function updateQuantity(id, qty) {
    const quantity = Number(qty);

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", id);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
    showToast("Cart updated.");
  }

  async function removeItem(id) {
    const { error } = await supabase.from("cart_items").delete().eq("id", id);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setCartItems((prev) => prev.filter((i) => i.id !== id));
    showToast("Item removed from cart.");
  }

  async function clearCart() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const ok = await confirmDialog({
      title: "Clear cart?",
      text: "Ma hubtaa inaad cart-ka dhan tirtirayso?",
      confirmButtonText: "Clear Cart",
    });
    if (!ok) return;

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setCartItems([]);
    showToast("Cart cleared.");
  }

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, i) => {
      const discount = Number(i.discount || 0);
      const finalPrice = Number(i.price || 0) - (Number(i.price || 0) * discount) / 100;
      return sum + finalPrice * Number(i.quantity || 0);
    }, 0);
  }, [cartItems]);

  const delivery = cartItems.length > 0 ? 5 : 0;
  const total = subtotal + delivery;
  const itemsCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.loadingBox}>
          <ShoppingCart size={34} color="#f5a400" />
          <p style={styles.loadingText}>Loading cart...</p>
        </section>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main style={styles.page}>
        <section style={styles.header}>
          <div>
            <p style={styles.badge}>NEW DUBAI CART</p>
            <h1 style={styles.title}>Shopping Cart</h1>
            <p style={styles.subtitle}>Your selected products will appear here.</p>
          </div>

          <Link href="/dashboard" style={styles.backBtn}>
            <ArrowLeft size={18} />
            Back Home
          </Link>
        </section>

        <section style={styles.emptyBox}>
          <div style={styles.emptyIcon}>
            <ShoppingCart size={42} />
          </div>

          <h2 style={styles.emptyTitle}>Cart Empty</h2>
          <p style={styles.emptyText}>
            Wax products ah cart-kaaga kuma jiraan. Ku noqo shop-ka oo alaab dooro.
          </p>

          <Link href="/dashboard" style={styles.shopBtn}>
            Shop Now
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.badge}>NEW DUBAI CART</p>
          <h1 style={styles.title}>Shopping Cart</h1>
          <p style={styles.subtitle}>
            Review your selected products before checkout.
          </p>
        </div>

        <Link href="/dashboard" style={styles.backBtn}>
          <ArrowLeft size={18} />
          Back Home
        </Link>
      </section>

      <section style={styles.layout}>
        <div style={styles.leftPanel}>
          <div style={styles.panelTop}>
            <div>
              <h2 style={styles.panelTitle}>Cart Items</h2>
              <p style={styles.panelSub}>
                {itemsCount} item{itemsCount === 1 ? "" : "s"} selected
              </p>
            </div>

            <button type="button" onClick={clearCart} style={styles.clearBtn}>
              Clear Cart
            </button>
          </div>

          <div style={styles.itemsList}>
            {cartItems.map((item) => {
              const discount = Number(item.discount || 0);
              const oldPrice = Number(item.price || 0);
              const newPrice = oldPrice - (oldPrice * discount) / 100;
              const itemTotal = newPrice * Number(item.quantity || 0);

              return (
                <article key={item.id} style={styles.itemCard}>
                  <div style={styles.imageBox}>
                    <img
                      src={item.image_url || "/images/t-shirts.jpg"}
                      alt={item.product_name}
                      style={styles.productImg}
                    />
                  </div>

                  <div style={styles.itemInfo}>
                    <p style={styles.category}>{item.category}</p>
                    <h3 style={styles.productName}>{item.product_name}</h3>

                    <div style={styles.stockRow}>
                      <span style={styles.inStock}>
                        <CheckCircle size={14} />
                        In Stock
                      </span>

                      {item.stock <= 5 && (
                        <span style={styles.lowStock}>Low Stock</span>
                      )}
                    </div>

                    <div style={styles.priceRow}>
                      <span style={styles.newPrice}>${newPrice.toFixed(2)}</span>

                      {discount > 0 && (
                        <>
                          <span style={styles.oldPrice}>
                            ${oldPrice.toFixed(2)}
                          </span>
                          <span style={styles.discountBadge}>
                            {discount}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    <p style={styles.itemTotal}>
                      Item total: ${itemTotal.toFixed(2)}
                    </p>
                  </div>

                  <div style={styles.itemActions}>
                    <select
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, e.target.value)}
                      style={styles.qtySelect}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((q) => (
                        <option key={q} value={q}>
                          Qty {q}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      style={styles.removeBtn}
                    >
                      <Trash2 size={17} />
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside style={styles.summaryCard}>
          <div style={styles.summaryHead}>
            <div style={styles.summaryIcon}>
              <PackageCheck size={24} />
            </div>

            <div>
              <h2 style={styles.summaryTitle}>Order Summary</h2>
              <p style={styles.summarySub}>Ready for checkout</p>
            </div>
          </div>

          <div style={styles.summaryRows}>
            <div style={styles.summaryRow}>
              <span>Items</span>
              <strong>{itemsCount}</strong>
            </div>

            <div style={styles.summaryRow}>
              <span>Subtotal</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>

            <div style={styles.summaryRow}>
              <span>Delivery</span>
              <strong>${delivery.toFixed(2)}</strong>
            </div>

            <div style={styles.totalRow}>
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
          </div>

          <Link href="/checkout" style={styles.checkoutBtn}>
            Checkout
          </Link>

          <Link href="/dashboard" style={styles.continueBtn}>
            Continue Shopping
          </Link>
        </aside>
      </section>
    </main>
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
    background: "#070707",
    color: "#fff",
    borderRadius: "26px",
    padding: "24px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
  },

  badge: {
    margin: 0,
    color: "#f5a400",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  title: {
    margin: "8px 0 0",
    fontSize: "34px",
    fontWeight: "900",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#aaa",
    fontSize: "14px",
    fontWeight: "600",
  },

  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#f5a400",
    color: "#000",
    textDecoration: "none",
    padding: "13px 18px",
    borderRadius: "16px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 360px",
    gap: "20px",
    alignItems: "start",
  },

  leftPanel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "26px",
    padding: "20px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
  },

  panelTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    marginBottom: "16px",
  },

  panelTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "900",
  },

  panelSub: {
    margin: "5px 0 0",
    color: "#666",
    fontSize: "13px",
    fontWeight: "700",
  },

  clearBtn: {
    border: "1px solid #fecaca",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "14px",
    padding: "10px 14px",
    fontWeight: "900",
    cursor: "pointer",
  },

  itemsList: {
    display: "grid",
    gap: "14px",
  },

  itemCard: {
    display: "grid",
    gridTemplateColumns: "120px minmax(0, 1fr) 150px",
    gap: "16px",
    alignItems: "center",
    border: "1px solid #eeeeee",
    background: "#fafafa",
    borderRadius: "22px",
    padding: "14px",
    boxSizing: "border-box",
  },

  imageBox: {
    width: "120px",
    height: "120px",
    borderRadius: "20px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  productImg: {
    width: "105px",
    height: "105px",
    objectFit: "contain",
    display: "block",
  },

  itemInfo: {
    minWidth: 0,
  },

  category: {
    margin: 0,
    color: "#b45309",
    fontSize: "13px",
    fontWeight: "900",
  },

  productName: {
    margin: "6px 0 0",
    color: "#111",
    fontSize: "20px",
    fontWeight: "900",
    lineHeight: "26px",
  },

  stockRow: {
    marginTop: "10px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  inStock: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    color: "#166534",
    background: "#dcfce7",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "12px",
    fontWeight: "900",
  },

  lowStock: {
    color: "#9a3412",
    background: "#ffedd5",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "12px",
    fontWeight: "900",
  },

  priceRow: {
    marginTop: "12px",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    flexWrap: "wrap",
  },

  newPrice: {
    color: "#111",
    fontSize: "21px",
    fontWeight: "900",
  },

  oldPrice: {
    color: "#a1a1aa",
    textDecoration: "line-through",
    fontSize: "15px",
    fontWeight: "800",
  },

  discountBadge: {
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "11px",
    fontWeight: "900",
  },

  itemTotal: {
    margin: "8px 0 0",
    color: "#666",
    fontSize: "13px",
    fontWeight: "700",
  },

  itemActions: {
    display: "grid",
    gap: "10px",
    justifyItems: "stretch",
  },

  qtySelect: {
    height: "44px",
    border: "1px solid #d4d4d8",
    borderRadius: "14px",
    background: "#fff",
    color: "#111",
    padding: "0 12px",
    fontSize: "14px",
    fontWeight: "900",
    outline: "none",
  },

  removeBtn: {
    height: "44px",
    border: "1px solid #fecaca",
    background: "#fff",
    color: "#dc2626",
    borderRadius: "14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    fontSize: "14px",
    fontWeight: "900",
    cursor: "pointer",
  },

  summaryCard: {
    background: "#070707",
    color: "#fff",
    borderRadius: "26px",
    padding: "22px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
    border: "1px solid rgba(245,164,0,0.22)",
    position: "sticky",
    top: "22px",
  },

  summaryHead: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },

  summaryIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "#f5a400",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "23px",
    fontWeight: "900",
  },

  summarySub: {
    margin: "4px 0 0",
    color: "#aaa",
    fontSize: "12px",
    fontWeight: "700",
  },

  summaryRows: {
    display: "grid",
    gap: "13px",
    marginTop: "8px",
  },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    color: "#ddd",
    fontSize: "14px",
    fontWeight: "700",
  },

  totalRow: {
    marginTop: "4px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    color: "#fff",
    fontSize: "22px",
    fontWeight: "900",
  },

  checkoutBtn: {
    marginTop: "22px",
    height: "52px",
    borderRadius: "18px",
    background: "#f5a400",
    color: "#000",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  continueBtn: {
    marginTop: "10px",
    height: "48px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.08)",
    color: "#f5a400",
    border: "1px solid rgba(245,164,0,0.28)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyBox: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "26px",
    padding: "60px 24px",
    textAlign: "center",
    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
  },

  emptyIcon: {
    width: "78px",
    height: "78px",
    borderRadius: "24px",
    background: "#fef3c7",
    color: "#92400e",
    margin: "0 auto 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "900",
  },

  emptyText: {
    margin: "12px auto 24px",
    maxWidth: "520px",
    color: "#666",
    fontWeight: "700",
    lineHeight: "24px",
  },

  shopBtn: {
    display: "inline-flex",
    background: "#000",
    color: "#f5a400",
    textDecoration: "none",
    padding: "14px 22px",
    borderRadius: "16px",
    fontWeight: "900",
  },

  loadingBox: {
    minHeight: "360px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "26px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
  },

  loadingText: {
    margin: 0,
    color: "#666",
    fontWeight: "800",
  },
};
