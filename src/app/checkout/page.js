"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  MapPin,
  Phone,
  User,
  Wallet,
  Truck,
  BadgeDollarSign,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { showToast } from "@/lib/adminUi";

export default function CheckoutPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    paymentMethod: "Sahal",
    payNumber: "",
    transactionRef: "",
  });

  async function loadCheckoutData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, phone, email")
      .eq("id", user.id)
      .maybeSingle();

    if (profileData) {
      setForm((prev) => ({
        ...prev,
        fullName: profileData.username || "",
        phone: profileData.phone || "",
        email: profileData.email || "",
        payNumber: profileData.phone || "",
      }));
    }

    const { data: cartData } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!cartData || cartData.length === 0) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    const productIds = cartData.map((item) => item.product_id).filter(Boolean);

    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, price, category, image_url, stock")
      .in("id", productIds);

    const productMap = new Map(
      (productsData || []).map((product) => [String(product.id), product])
    );

    const merged = cartData.map((item) => {
      const product = productMap.get(String(item.product_id));

      return {
        ...item,
        product_name: product?.name || "Product",
        category: product?.category || "",
        price: Number(product?.price || 0),
        image_url: product?.image_url || "/images/t-shirts.jpg",
        stock: Number(product?.stock ?? 0),
      };
    });

    setCartItems(merged);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCheckoutData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function selectPaymentMethod(method) {
    setForm((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  }

  const itemsCount = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
  }, [cartItems]);

  const delivery = itemsCount > 0 ? 5 : 0;
  const total = subtotal + delivery;

  async function handlePlaceOrder(e) {
    e.preventDefault();

    if (
      !form.fullName ||
      !form.phone ||
      !form.address ||
      !form.city ||
      !form.payNumber ||
      !form.transactionRef
    ) {
      showToast("Fadlan buuxi dhammaan xogta muhiimka ah.", "error");
      return;
    }

    if (cartItems.length === 0) {
      showToast("Cart-kaagu waa madhan yahay.", "error");
      return;
    }

    setPlacingOrder(true);

    const response = await fetch("/api/checkout/place-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ form }),
    });

    const result = await response.json();

    if (!response.ok) {
      showToast(result.error || "Order lama dhigi karin.", "error");
      setPlacingOrder(false);
      return;
    }

    setSuccessData(result);

    setCartItems([]);
    showToast("Order placed successfully.");
    setPlacingOrder(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffdf7] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <p className="text-zinc-500">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="min-h-screen bg-[#fffdf7] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle size={42} className="text-green-600" />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-yellow-600">
                Payment Successful
              </p>
              <h1 className="mt-2 text-3xl font-bold text-black">
                Waxaad ku guulaysatay lacag dirista
              </h1>
              <p className="mt-3 text-zinc-600">
                Payment-kaaga si guul leh ayaa loo diiwaangeliyay.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Customer</p>
                <p className="mt-1 font-semibold text-black">
                  {successData.fullName}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Payment Method</p>
                <p className="mt-1 font-semibold text-black">
                  {successData.paymentMethod}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Invoice No</p>
                <p className="mt-1 font-semibold text-black">
                  {successData.invoiceNo}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Transaction Ref</p>
                <p className="mt-1 font-semibold text-black">
                  {successData.transactionRef}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:col-span-2">
                <p className="text-sm text-zinc-500">Amount Paid</p>
                <p className="mt-1 text-2xl font-bold text-black">
                  ${Number(successData.amount || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="flex-1 rounded-2xl bg-black px-5 py-3 text-center font-semibold text-yellow-400 hover:opacity-90"
              >
                Continue Shopping
              </Link>

              <Link
                href="/orders"
                className="flex-1 rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-center font-semibold text-black hover:bg-zinc-50"
              >
                View Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#fffdf7] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-black">Checkout</h1>
          <p className="mt-3 text-zinc-500">No items available for checkout.</p>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-2xl bg-black px-5 py-3 font-semibold text-yellow-400 hover:opacity-90"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffdf7] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-yellow-600">
                Secure Checkout
              </p>
              <h1 className="mt-1 text-3xl font-bold text-black md:text-4xl">
                Complete your payment
              </h1>
              <p className="mt-2 text-zinc-600">
                Review your order and simulate payment securely.
              </p>
            </div>

            <Link
              href="/cart"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 font-semibold text-yellow-400 hover:opacity-90"
            >
              <ArrowLeft size={18} />
              Back to Cart
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={handlePlaceOrder} className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-black">
                Customer Information
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <InputField
                  icon={<User size={16} />}
                  name="fullName"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={handleChange}
                />

                <InputField
                  icon={<Phone size={16} />}
                  name="phone"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={handleChange}
                />

                <InputField
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  className="md:col-span-2"
                />

                <InputField
                  icon={<MapPin size={16} />}
                  name="address"
                  placeholder="Address"
                  value={form.address}
                  onChange={handleChange}
                  className="md:col-span-2"
                />

                <InputField
                  name="city"
                  placeholder="City"
                  value={form.city}
                  onChange={handleChange}
                />

                <InputField
                  icon={<Wallet size={16} />}
                  name="payNumber"
                  placeholder="Mobile Number to Pay"
                  value={form.payNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-black">Payment Method</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <PaymentCard
                  active={form.paymentMethod === "Sahal"}
                  title="Sahal"
                  subtitle="Mobile money payment"
                  icon={<CreditCard size={20} />}
                  onClick={() => selectPaymentMethod("Sahal")}
                />

                <PaymentCard
                  active={form.paymentMethod === "Zaad"}
                  title="Zaad"
                  subtitle="Fast mobile transfer"
                  icon={<BadgeDollarSign size={20} />}
                  onClick={() => selectPaymentMethod("Zaad")}
                />

                <PaymentCard
                  active={form.paymentMethod === "E-Dahab"}
                  title="E-Dahab"
                  subtitle="Dahabshiil payment"
                  icon={<Wallet size={20} />}
                  onClick={() => selectPaymentMethod("E-Dahab")}
                />

                <PaymentCard
                  active={form.paymentMethod === "Cash on Delivery"}
                  title="Cash on Delivery"
                  subtitle="Pay when delivered"
                  icon={<Truck size={20} />}
                  onClick={() => selectPaymentMethod("Cash on Delivery")}
                />
              </div>

              <div className="mt-5">
                <InputField
                  name="transactionRef"
                  placeholder="Transaction Reference"
                  value={form.transactionRef}
                  onChange={handleChange}
                />
              </div>
            </div>
          </form>

          <div className="checkout-summary" style={summaryStyles.wrapper}>
            <div className="checkout-summary-card" style={summaryStyles.card}>
              <h2 style={summaryStyles.title}>Order Summary</h2>

              <div style={summaryStyles.itemsList}>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="checkout-summary-item"
                    style={summaryStyles.itemCard}
                  >
                    <div style={summaryStyles.imageBox}>
                      <img
                        src={item.image_url || "/images/t-shirts.jpg"}
                        alt={item.product_name}
                        style={summaryStyles.image}
                      />
                    </div>

                    <div style={summaryStyles.itemInfo}>
                      <p style={summaryStyles.itemName}>{item.product_name}</p>
                      <p style={summaryStyles.itemMeta}>
                        {item.color ? `${item.color} · ` : ""}
                        {item.size ? `${item.size} · ` : ""}Qty{" "}
                        {item.quantity}
                      </p>
                    </div>

                    <div style={summaryStyles.itemPrice}>
                      $
                      {(
                        Number(item.price) * Number(item.quantity)
                      ).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={summaryStyles.totals}>
                <div style={summaryStyles.totalRow}>
                  <span>Items</span>
                  <strong>{itemsCount}</strong>
                </div>

                <div style={summaryStyles.totalRow}>
                  <span>Subtotal</span>
                  <strong>${subtotal.toFixed(2)}</strong>
                </div>

                <div style={summaryStyles.totalRow}>
                  <span>Delivery</span>
                  <strong>${delivery.toFixed(2)}</strong>
                </div>

                <div style={summaryStyles.grandTotal}>
                  <span>Total</span>
                  <strong>${total.toFixed(2)}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                style={{
                  ...summaryStyles.payBtn,
                  opacity: placingOrder ? 0.6 : 1,
                  cursor: placingOrder ? "not-allowed" : "pointer",
                }}
              >
                {placingOrder ? "Processing Payment..." : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const summaryStyles = {
  wrapper: {
    display: "block",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "28px",
    padding: "20px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
    width: "100%",
    boxSizing: "border-box",
  },

  title: {
    margin: "0 0 16px",
    fontSize: "26px",
    fontWeight: "900",
    color: "#111",
    lineHeight: "32px",
  },

  itemsList: {
    display: "grid",
    gap: "12px",
  },

  itemCard: {
    display: "grid",
    gridTemplateColumns: "78px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: "12px",
    background: "#fafafa",
    border: "1px solid #eeeeee",
    borderRadius: "20px",
    padding: "10px",
    minHeight: "98px",
    boxSizing: "border-box",
  },

  imageBox: {
    width: "78px",
    height: "78px",
    borderRadius: "16px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },

  image: {
    width: "68px",
    height: "68px",
    objectFit: "contain",
    display: "block",
  },

  itemInfo: {
    minWidth: 0,
  },

  itemName: {
    margin: 0,
    color: "#111",
    fontSize: "15px",
    fontWeight: "900",
    lineHeight: "20px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  itemMeta: {
    margin: "5px 0 0",
    color: "#71717a",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "16px",
  },

  itemPrice: {
    color: "#111",
    fontSize: "14px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  totals: {
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
    display: "grid",
    gap: "11px",
    color: "#3f3f46",
    fontSize: "14px",
    fontWeight: "700",
  },

  totalRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  grandTotal: {
    marginTop: "4px",
    paddingTop: "12px",
    borderTop: "1px dashed #d4d4d8",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#111",
    fontSize: "20px",
    fontWeight: "900",
  },

  payBtn: {
    marginTop: "18px",
    width: "100%",
    height: "52px",
    border: "none",
    borderRadius: "18px",
    background: "#070707",
    color: "#f5a400",
    fontSize: "16px",
    fontWeight: "900",
    boxShadow: "0 15px 30px rgba(0,0,0,0.18)",
  },
};

function InputField({
  icon,
  name,
  placeholder,
  value,
  onChange,
  className = "",
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-3">
        {icon ? <span className="text-zinc-500">{icon}</span> : null}

        <input
          type="text"
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full bg-transparent text-black outline-none placeholder:text-zinc-500"
        />
      </div>
    </div>
  );
}

function PaymentCard({ active, title, subtitle, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-yellow-500 bg-black text-yellow-400"
          : "border-zinc-200 bg-white text-black hover:border-yellow-500"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`rounded-xl p-2 ${
            active ? "bg-yellow-500/20 text-yellow-400" : "bg-zinc-100 text-black"
          }`}
        >
          {icon}
        </div>

        <div>
          <p className="font-semibold">{title}</p>
          <p className={`text-xs ${active ? "text-zinc-300" : "text-zinc-500"}`}>
            {subtitle}
          </p>
        </div>
      </div>
    </button>
  );
}
