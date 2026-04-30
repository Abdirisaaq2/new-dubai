import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

function getOrderStatus(order) {
  return (order?.order_status || order?.status || "pending").toLowerCase();
}

function getSteps(status) {
  const steps = ["pending", "processing", "shipped", "delivered"];

  if (status === "cancelled") {
    return [
      { key: "pending", label: "Order Placed", done: true },
      { key: "cancelled", label: "Cancelled", done: true, cancelled: true },
    ];
  }

  const currentIndex = steps.indexOf(status);

  return [
    {
      key: "pending",
      label: "Order Placed",
      done: currentIndex >= 0,
    },
    {
      key: "processing",
      label: "Processing",
      done: currentIndex >= 1,
    },
    {
      key: "shipped",
      label: "Shipped",
      done: currentIndex >= 2,
    },
    {
      key: "delivered",
      label: "Delivered",
      done: currentIndex >= 3,
    },
  ];
}

export default async function TrackOrderPage({ searchParams }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const orderQuery = searchParams?.order || "";

  let selectedOrder = null;
  let latestOrders = [];
  let errorMessage = "";

  if (orderQuery) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("id", orderQuery)
      .maybeSingle();

    if (error) {
      errorMessage = error.message;
    }

    selectedOrder = data;
  }

  if (!selectedOrder) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      errorMessage = error.message;
    }

    latestOrders = data || [];
    selectedOrder = latestOrders[0] || null;
  }

  const status = getOrderStatus(selectedOrder);
  const steps = getSteps(status);

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.smallTitle}>NEW DUBAI CUSTOMER</p>
          <h1 style={styles.title}>Track Order</h1>
          <p style={styles.subtitle}>
            Follow your order from pending to delivered.
          </p>
        </div>

        <div style={styles.headerActions}>
          <Link href="/orders" style={styles.blackBtn}>
            My Orders
          </Link>

          <Link href="/dashboard" style={styles.goldBtn}>
            Back Home
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <section style={styles.errorBox}>
          <h2 style={styles.errorTitle}>Database Error</h2>
          <p style={styles.errorText}>{errorMessage}</p>
        </section>
      ) : null}

      {!selectedOrder ? (
        <section style={styles.emptyBox}>
          <h2 style={styles.emptyTitle}>No order to track</h2>
          <p style={styles.emptyText}>
            You do not have any order yet. Add products to cart and checkout
            first.
          </p>

          <Link href="/dashboard" style={styles.shopBtn}>
            Continue Shopping
          </Link>
        </section>
      ) : (
        <section style={styles.contentGrid}>
          <div style={styles.trackCard}>
            <div style={styles.orderTop}>
              <div>
                <p style={styles.label}>Tracking Order</p>
                <h2 style={styles.orderId}>
                  #{String(
                    selectedOrder.invoice_no ||
                      selectedOrder.order_invoice_no ||
                      selectedOrder.id
                  ).slice(0, 12)}
                </h2>
              </div>

              <span style={getStatusBadgeStyle(status)}>
                {status.toUpperCase()}
              </span>
            </div>

            <div style={styles.timeline}>
              {steps.map((step, index) => (
                <div key={step.key} style={styles.stepRow}>
                  <div style={styles.stepLeft}>
                    <div
                      style={{
                        ...styles.stepCircle,
                        background: step.cancelled
                          ? "#dc2626"
                          : step.done
                          ? "#f5a400"
                          : "#e5e7eb",
                        color: step.done ? "#000" : "#777",
                      }}
                    >
                      {step.done ? "✓" : index + 1}
                    </div>

                    {index !== steps.length - 1 && (
                      <div
                        style={{
                          ...styles.stepLine,
                          background: step.done ? "#f5a400" : "#e5e7eb",
                        }}
                      />
                    )}
                  </div>

                  <div style={styles.stepContent}>
                    <h3 style={styles.stepTitle}>{step.label}</h3>
                    <p style={styles.stepText}>
                      {step.cancelled
                        ? "Your order has been cancelled."
                        : step.done
                        ? "This step is completed."
                        : "Waiting for this step."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside style={styles.summaryCard}>
            <h2 style={styles.summaryTitle}>Order Summary</h2>

            <div style={styles.summaryItem}>
              <span>Total</span>
              <strong>
                $
                {Number(
                  selectedOrder.total_amount ||
                    selectedOrder.total ||
                    selectedOrder.amount ||
                    0
                ).toFixed(2)}
              </strong>
            </div>

            <div style={styles.summaryItem}>
              <span>Payment Method</span>
              <strong>
                {selectedOrder.payment_method || "Mobile Money"}
              </strong>
            </div>

            <div style={styles.summaryItem}>
              <span>Payment Status</span>
              <strong>{selectedOrder.payment_status || "Pending"}</strong>
            </div>

            <div style={styles.summaryItem}>
              <span>Phone</span>
              <strong>
                {selectedOrder.customer_phone ||
                  selectedOrder.phone ||
                  "Not added"}
              </strong>
            </div>

            <div style={styles.summaryItem}>
              <span>Date</span>
              <strong>
                {selectedOrder.created_at
                  ? new Date(selectedOrder.created_at).toLocaleDateString()
                  : "-"}
              </strong>
            </div>

            <Link
              href={`/orders/${selectedOrder.id}`}
              style={styles.detailsBtn}
            >
              View Order Details
            </Link>
          </aside>
        </section>
      )}

      {latestOrders.length > 1 ? (
        <section style={styles.latestBox}>
          <h2 style={styles.latestTitle}>Recent Orders</h2>

          <div style={styles.latestList}>
            {latestOrders.map((order) => {
              const orderStatus = getOrderStatus(order);

              return (
                <Link
                  key={order.id}
                  href={`/orders/track?order=${order.id}`}
                  style={styles.latestItem}
                >
                  <div>
                    <strong>
                      #
                      {String(
                        order.invoice_no || order.order_invoice_no || order.id
                      ).slice(0, 12)}
                    </strong>
                    <p>
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>

                  <span style={getStatusBadgeStyle(orderStatus)}>
                    {orderStatus}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function getStatusBadgeStyle(status) {
  const base = {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  };

  if (status === "delivered") {
    return { ...base, background: "#dcfce7", color: "#166534" };
  }

  if (status === "shipped") {
    return { ...base, background: "#dbeafe", color: "#1d4ed8" };
  }

  if (status === "processing") {
    return { ...base, background: "#fef3c7", color: "#92400e" };
  }

  if (status === "cancelled") {
    return { ...base, background: "#fee2e2", color: "#991b1b" };
  }

  return { ...base, background: "#ffedd5", color: "#9a3412" };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f5f7",
    padding: "22px",
    fontFamily: "Arial, sans-serif",
    color: "#111",
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

  smallTitle: {
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
  },

  headerActions: {
    display: "flex",
    gap: "10px",
  },

  blackBtn: {
    background: "#111",
    color: "#f5a400",
    border: "1px solid rgba(245,164,0,0.35)",
    textDecoration: "none",
    padding: "13px 18px",
    borderRadius: "16px",
    fontWeight: "900",
  },

  goldBtn: {
    background: "#f5a400",
    color: "#000",
    textDecoration: "none",
    padding: "13px 18px",
    borderRadius: "16px",
    fontWeight: "900",
  },

  errorBox: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: "20px",
    padding: "18px",
    marginBottom: "18px",
  },

  errorTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "900",
  },

  errorText: {
    margin: "8px 0 0",
    fontWeight: "700",
  },

  emptyBox: {
    background: "#fff",
    borderRadius: "26px",
    padding: "60px 24px",
    textAlign: "center",
    border: "1px solid #e5e5e5",
    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "900",
  },

  emptyText: {
    margin: "12px auto 24px",
    maxWidth: "520px",
    color: "#666",
    fontWeight: "600",
  },

  shopBtn: {
    display: "inline-flex",
    background: "#000",
    color: "#f5a400",
    textDecoration: "none",
    padding: "14px 20px",
    borderRadius: "16px",
    fontWeight: "900",
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 360px",
    gap: "18px",
    alignItems: "start",
  },

  trackCard: {
    background: "#fff",
    borderRadius: "26px",
    padding: "24px",
    border: "1px solid #e5e5e5",
    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
  },

  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "28px",
  },

  label: {
    margin: 0,
    color: "#777",
    fontSize: "12px",
    fontWeight: "800",
  },

  orderId: {
    margin: "6px 0 0",
    fontSize: "26px",
    fontWeight: "900",
  },

  timeline: {
    display: "grid",
    gap: "0",
  },

  stepRow: {
    display: "grid",
    gridTemplateColumns: "50px 1fr",
    gap: "14px",
    minHeight: "92px",
  },

  stepLeft: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
  },

  stepCircle: {
    width: "38px",
    height: "38px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "900",
    zIndex: 2,
  },

  stepLine: {
    position: "absolute",
    top: "38px",
    width: "4px",
    height: "54px",
    borderRadius: "999px",
  },

  stepContent: {
    paddingTop: "5px",
  },

  stepTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "900",
  },

  stepText: {
    margin: "8px 0 0",
    color: "#666",
    fontWeight: "600",
  },

  summaryCard: {
    background: "#070707",
    color: "#fff",
    borderRadius: "26px",
    padding: "22px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.18)",
  },

  summaryTitle: {
    margin: "0 0 18px",
    color: "#f5a400",
    fontSize: "22px",
    fontWeight: "900",
  },

  summaryItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    padding: "13px 0",
    fontSize: "14px",
  },

  detailsBtn: {
    marginTop: "18px",
    display: "block",
    textAlign: "center",
    background: "#f5a400",
    color: "#000",
    textDecoration: "none",
    padding: "14px",
    borderRadius: "16px",
    fontWeight: "900",
  },

  latestBox: {
    marginTop: "20px",
    background: "#fff",
    borderRadius: "26px",
    padding: "22px",
    border: "1px solid #e5e5e5",
    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
  },

  latestTitle: {
    margin: "0 0 14px",
    fontSize: "22px",
    fontWeight: "900",
  },

  latestList: {
    display: "grid",
    gap: "10px",
  },

  latestItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    background: "#fafafa",
    border: "1px solid #eee",
    color: "#111",
    textDecoration: "none",
    borderRadius: "18px",
    padding: "14px",
  },
};