import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

function StatusBadge({ status }) {
  const value = (status || "pending").toLowerCase();

  const style =
    value === "delivered"
      ? styles.delivered
      : value === "processing"
      ? styles.processing
      : value === "cancelled"
      ? styles.cancelled
      : value === "shipped"
      ? styles.shipped
      : value === "paid"
      ? styles.paid
      : styles.pending;

  return (
    <span style={{ ...styles.badge, ...style }}>
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </span>
  );
}

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Orders error:", error.message);
  }

  return (
    <main className="orders-page responsive-shop-page" style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.smallTitle}>NEW DUBAI CUSTOMER</p>
          <h1 style={styles.title}>My Orders</h1>
          <p style={styles.subtitle}>
            View your orders, payment status, and delivery progress.
          </p>
        </div>

        <Link href="/dashboard" style={styles.backBtn}>
          Back Home
        </Link>
      </section>

      {error ? (
        <section style={styles.errorBox}>
          <h2 style={styles.errorTitle}>Orders error</h2>
          <p style={styles.errorText}>{error.message}</p>
        </section>
      ) : null}

      {!orders || orders.length === 0 ? (
        <section style={styles.empty}>
          <div style={styles.emptyIcon}>🛍️</div>
          <h2 style={styles.emptyTitle}>No orders yet</h2>
          <p style={styles.emptyText}>
            You have not placed any order yet. Add products to cart and checkout
            first.
          </p>

          <Link href="/dashboard" style={styles.shopBtn}>
            Continue Shopping
          </Link>
        </section>
      ) : (
        <section style={styles.grid}>
          {orders.map((order) => {
            const orderStatus = order.order_status || order.status || "pending";
            const paymentStatus = order.payment_status || "pending";
            const total = order.total_amount || order.total || order.amount || 0;
            const invoice =
              order.invoice_no ||
              order.order_invoice_no ||
              String(order.id).slice(0, 8);

            return (
              <article key={order.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <p style={styles.label}>Invoice No</p>
                    <h3 style={styles.invoice}>#{invoice}</h3>
                  </div>

                  <StatusBadge status={orderStatus} />
                </div>

                <div style={styles.infoBox}>
                  <div>
                    <p style={styles.label}>Total</p>
                    <p style={styles.value}>${Number(total).toFixed(2)}</p>
                  </div>

                  <div>
                    <p style={styles.label}>Payment</p>
                    <p style={styles.value}>
                      {order.payment_method || "Mobile Money"}
                    </p>
                  </div>

                  <div>
                    <p style={styles.label}>Payment Status</p>
                    <div style={{ marginTop: 6 }}>
                      <StatusBadge status={paymentStatus} />
                    </div>
                  </div>

                  <div>
                    <p style={styles.label}>Date</p>
                    <p style={styles.value}>
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>

                <div style={styles.actions}>
                  <Link href={`/orders/${order.id}`} style={styles.detailsBtn}>
                    View Details
                  </Link>

                  <Link
                    href={`/orders/track?order=${order.id}`}
                    style={styles.trackBtn}
                  >
                    Track Order
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
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

  backBtn: {
    background: "#f5a400",
    color: "#000",
    textDecoration: "none",
    padding: "13px 18px",
    borderRadius: "16px",
    fontWeight: "900",
    whiteSpace: "nowrap",
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

  empty: {
    background: "#fff",
    borderRadius: "26px",
    padding: "60px 24px",
    textAlign: "center",
    border: "1px solid #e5e5e5",
    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
  },

  emptyIcon: {
    width: "72px",
    height: "72px",
    margin: "0 auto 16px",
    borderRadius: "22px",
    background: "#fef3c7",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px",
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
    lineHeight: "24px",
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

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },

  card: {
    background: "#fff",
    borderRadius: "24px",
    padding: "20px",
    border: "1px solid #e5e5e5",
    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px",
  },

  label: {
    margin: 0,
    color: "#777",
    fontSize: "12px",
    fontWeight: "800",
  },

  invoice: {
    margin: "5px 0 0",
    fontSize: "20px",
    fontWeight: "900",
    color: "#111",
  },

  infoBox: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    background: "#fafafa",
    borderRadius: "18px",
    padding: "16px",
    border: "1px solid #eee",
  },

  value: {
    margin: "5px 0 0",
    color: "#111",
    fontSize: "14px",
    fontWeight: "900",
  },

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "18px",
  },

  detailsBtn: {
    flex: 1,
    textAlign: "center",
    background: "#000",
    color: "#f5a400",
    textDecoration: "none",
    padding: "13px",
    borderRadius: "16px",
    fontWeight: "900",
  },

  trackBtn: {
    flex: 1,
    textAlign: "center",
    background: "#f5a400",
    color: "#000",
    textDecoration: "none",
    padding: "13px",
    borderRadius: "16px",
    fontWeight: "900",
  },

  badge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap",
    display: "inline-flex",
  },

  pending: {
    background: "#ffedd5",
    color: "#9a3412",
  },

  processing: {
    background: "#fef3c7",
    color: "#92400e",
  },

  shipped: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },

  paid: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },

  delivered: {
    background: "#dcfce7",
    color: "#166534",
  },

  cancelled: {
    background: "#fee2e2",
    color: "#991b1b",
  },
};
