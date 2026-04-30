import Link from "next/link";
import { redirect, notFound } from "next/navigation";
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

export default async function OrderDetailsPage({ params }) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (orderError) {
    console.log("Order details error:", orderError.message);
  }

  if (!order) {
    notFound();
  }

  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.log("Order items error:", itemsError.message);
  }

  const orderStatus = order.order_status || order.status || "pending";
  const paymentStatus = order.payment_status || "pending";
  const total = order.total_amount || order.total || order.amount || 0;
  const invoice =
    order.invoice_no || order.order_invoice_no || String(order.id).slice(0, 8);

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.smallTitle}>NEW DUBAI CUSTOMER</p>
          <h1 style={styles.title}>Order Details</h1>
          <p style={styles.subtitle}>
            Full information about your order and products.
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

      <section style={styles.detailsGrid}>
        <div style={styles.mainCard}>
          <div style={styles.orderTop}>
            <div>
              <p style={styles.label}>Invoice No</p>
              <h2 style={styles.invoice}>#{invoice}</h2>
            </div>

            <StatusBadge status={orderStatus} />
          </div>

          <div style={styles.infoGrid}>
            <InfoBox label="Total Amount" value={`$${Number(total).toFixed(2)}`} />

            <InfoBox
              label="Payment Method"
              value={order.payment_method || "Mobile Money"}
            />

            <div style={styles.infoBox}>
              <p style={styles.label}>Payment Status</p>
              <div style={{ marginTop: 8 }}>
                <StatusBadge status={paymentStatus} />
              </div>
            </div>

            <InfoBox
              label="Order Date"
              value={
                order.created_at
                  ? new Date(order.created_at).toLocaleString()
                  : "-"
              }
            />

            <InfoBox
              label="Phone"
              value={order.customer_phone || order.phone || "Not added"}
            />

            <InfoBox
              label="Address"
              value={
                order.address || order.customer_address || "Not added"
              }
            />
          </div>

          <div style={styles.actions}>
            <Link href={`/orders/track?order=${order.id}`} style={styles.trackBtn}>
              Track Order
            </Link>
          </div>
        </div>

        <aside style={styles.sideCard}>
          <h2 style={styles.sideTitle}>Order Progress</h2>

          <div style={styles.progressList}>
            <ProgressStep title="Order Placed" done={true} />

            <ProgressStep
              title="Processing"
              done={["processing", "shipped", "delivered"].includes(
                orderStatus.toLowerCase()
              )}
            />

            <ProgressStep
              title="Shipped"
              done={["shipped", "delivered"].includes(
                orderStatus.toLowerCase()
              )}
            />

            <ProgressStep
              title="Delivered"
              done={orderStatus.toLowerCase() === "delivered"}
            />
          </div>
        </aside>
      </section>

      <section style={styles.itemsCard}>
        <div style={styles.itemsHeader}>
          <h2 style={styles.itemsTitle}>Order Items</h2>
          <p style={styles.itemsSub}>Products included in this order.</p>
        </div>

        {!orderItems || orderItems.length === 0 ? (
          <div style={styles.emptyItems}>
            <h3 style={{ margin: 0 }}>No order items found</h3>
            <p style={{ margin: "8px 0 0" }}>
              Order-ka wuu jiraa, laakiin products-ka order_items table weli laguma
              kaydin.
            </p>
          </div>
        ) : (
          <div style={styles.itemsList}>
            {orderItems.map((item) => (
              <div key={item.id} style={styles.itemRow}>
                <div style={styles.productInfo}>
                  <img
                    src={item.image_url || "/images/t-shirts.jpg"}
                    alt={item.product_name || "Product"}
                    style={styles.productImg}
                  />

                  <div>
                    <h3 style={styles.productName}>
                      {item.product_name || "Product"}
                    </h3>
                    <p style={styles.productMeta}>
                      Quantity: {item.quantity || 1}
                    </p>
                  </div>
                </div>

                <div style={styles.productPrice}>
                  ${Number(item.price || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function InfoBox({ label, value }) {
  return (
    <div style={styles.infoBox}>
      <p style={styles.label}>{label}</p>
      <h3 style={styles.value}>{value}</h3>
    </div>
  );
}

function ProgressStep({ title, done }) {
  return (
    <div style={styles.progressStep}>
      <div
        style={{
          ...styles.progressDot,
          background: done ? "#f5a400" : "#333",
          color: done ? "#000" : "#999",
        }}
      >
        {done ? "✓" : "•"}
      </div>

      <div>
        <h3 style={styles.progressTitle}>{title}</h3>
        <p style={styles.progressText}>
          {done ? "Completed or active step" : "Waiting for update"}
        </p>
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
    whiteSpace: "nowrap",
  },

  goldBtn: {
    background: "#f5a400",
    color: "#000",
    textDecoration: "none",
    padding: "13px 18px",
    borderRadius: "16px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 360px",
    gap: "18px",
    alignItems: "start",
  },

  mainCard: {
    background: "#fff",
    borderRadius: "26px",
    padding: "24px",
    border: "1px solid #e5e5e5",
    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
  },

  sideCard: {
    background: "#070707",
    color: "#fff",
    borderRadius: "26px",
    padding: "22px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.18)",
  },

  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "20px",
  },

  label: {
    margin: 0,
    color: "#777",
    fontSize: "12px",
    fontWeight: "800",
  },

  invoice: {
    margin: "6px 0 0",
    fontSize: "28px",
    fontWeight: "900",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },

  infoBox: {
    background: "#fafafa",
    border: "1px solid #eee",
    borderRadius: "18px",
    padding: "16px",
  },

  value: {
    margin: "8px 0 0",
    fontSize: "16px",
    fontWeight: "900",
    color: "#111",
  },

  actions: {
    marginTop: "18px",
  },

  trackBtn: {
    display: "inline-flex",
    background: "#f5a400",
    color: "#000",
    textDecoration: "none",
    padding: "14px 20px",
    borderRadius: "16px",
    fontWeight: "900",
  },

  sideTitle: {
    margin: "0 0 18px",
    color: "#f5a400",
    fontSize: "22px",
    fontWeight: "900",
  },

  progressList: {
    display: "grid",
    gap: "16px",
  },

  progressStep: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },

  progressDot: {
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    flexShrink: 0,
  },

  progressTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "900",
  },

  progressText: {
    margin: "4px 0 0",
    color: "#aaa",
    fontSize: "12px",
    fontWeight: "600",
  },

  itemsCard: {
    marginTop: "18px",
    background: "#fff",
    borderRadius: "26px",
    padding: "24px",
    border: "1px solid #e5e5e5",
    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
  },

  itemsHeader: {
    marginBottom: "18px",
  },

  itemsTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "900",
  },

  itemsSub: {
    margin: "6px 0 0",
    color: "#666",
    fontSize: "14px",
    fontWeight: "600",
  },

  emptyItems: {
    background: "#fafafa",
    border: "1px dashed #ccc",
    borderRadius: "18px",
    padding: "30px",
    textAlign: "center",
    color: "#666",
  },

  itemsList: {
    display: "grid",
    gap: "12px",
  },

  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    background: "#fafafa",
    border: "1px solid #eee",
    borderRadius: "18px",
    padding: "14px",
  },

  productInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  productImg: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    objectFit: "cover",
    background: "#eee",
  },

  productName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "900",
  },

  productMeta: {
    margin: "5px 0 0",
    color: "#777",
    fontSize: "13px",
    fontWeight: "700",
  },

  productPrice: {
    fontSize: "16px",
    fontWeight: "900",
    color: "#111",
    whiteSpace: "nowrap",
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