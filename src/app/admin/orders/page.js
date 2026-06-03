import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  ShoppingBag,
  Clock3,
  CheckCircle2,
  Truck,
  XCircle,
  DollarSign,
  ReceiptText,
  PackageCheck,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabaseServer";

function StatusBadge({ status }) {
  const value = (status || "pending").toLowerCase();

  if (value === "delivered") {
    return (
      <span style={{ ...styles.badge, background: "#dcfce7", color: "#166534" }}>
        Delivered
      </span>
    );
  }

  if (value === "paid") {
    return (
      <span style={{ ...styles.badge, background: "#dbeafe", color: "#1d4ed8" }}>
        Paid
      </span>
    );
  }

  if (value === "processing") {
    return (
      <span style={{ ...styles.badge, background: "#f3e8ff", color: "#7e22ce" }}>
        Processing
      </span>
    );
  }

  if (value === "cancelled") {
    return (
      <span style={{ ...styles.badge, background: "#fee2e2", color: "#991b1b" }}>
        Cancelled
      </span>
    );
  }

  return (
    <span style={{ ...styles.badge, background: "#fef3c7", color: "#92400e" }}>
      Pending
    </span>
  );
}

function compactDuplicateCheckoutAttempts(orders) {
  const latestByKey = new Map();
  const visibleOrders = [];
  const duplicateWindowMs = 30 * 60 * 1000;

  for (const order of orders) {
    const amount = Number(order.total_amount || order.amount || 0).toFixed(2);
    const key = [
      order.user_id || "",
      order.customer_phone || "",
      (order.customer_name || "").toLowerCase().trim(),
      (order.payment_method || "").toLowerCase().trim(),
      amount,
    ].join("|");
    const orderTime = new Date(order.created_at || 0).getTime();
    const latestTime = latestByKey.get(key);

    if (latestTime && Math.abs(latestTime - orderTime) <= duplicateWindowMs) {
      continue;
    }

    latestByKey.set(key, orderTime);
    visibleOrders.push(order);
  }

  return visibleOrders;
}

export default async function AdminOrdersPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const invoiceFilter = String(resolvedSearchParams?.invoice || "").trim();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active") redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard");

  async function updateOrderStatus(formData) {
    "use server";

    const orderId = formData.get("orderId");
    const status = formData.get("status");

    if (!orderId || !status) return;

    const supabase = await createClient();

    const { error } = await supabase
      .from("orders")
      .update({ order_status: status })
      .eq("id", orderId);

    if (error) {
      console.error("Update order status error:", error.message);
      return;
    }

    revalidatePath("/admin/orders");
    revalidatePath("/orders");
    revalidatePath("/orders/track");
  }

  let allOrders = [];
  let usedFallback = false;
  let ordersErrorMessage = "";

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (!ordersError && orders && orders.length > 0) {
    allOrders = orders.map((order) => ({
      ...order,
      source: "orders",
    }));
  } else {
    if (ordersError) ordersErrorMessage = ordersError.message;

    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (paymentsError) {
      return (
        <main className="admin-orders-page responsive-admin-page" style={styles.page}>
          <section style={styles.errorBox}>
            <AlertTriangle size={42} color="#991b1b" />
            <h1 style={styles.errorTitle}>Orders could not load</h1>
            <p style={styles.errorText}>
              {ordersErrorMessage || paymentsError.message}
            </p>
            <Link href="/admin" style={styles.backHome}>
              <ArrowLeft size={18} />
              Back Home
            </Link>
          </section>
        </main>
      );
    }

    usedFallback = true;
    allOrders = (payments || []).map((payment) => ({
      id: payment.id,
      user_id: payment.user_id,
      invoice_no: payment.order_invoice_no || payment.invoice_no || "-",
      customer_name: payment.customer_name || "-",
      customer_phone: payment.customer_phone || "-",
      total_amount: payment.amount || 0,
      payment_method: payment.payment_method || "-",
      payment_status: payment.payment_status || "Paid",
      order_status: "Pending",
      created_at: payment.created_at,
      source: "payments",
    }));
  }

  allOrders = compactDuplicateCheckoutAttempts(allOrders);

  if (invoiceFilter) {
    allOrders = allOrders.filter((order) => {
      const invoice = order.invoice_no || order.order_invoice_no || "";
      return String(invoice).toLowerCase() === invoiceFilter.toLowerCase();
    });
  }

  const totalOrders = allOrders.length;

  const pendingOrders = allOrders.filter(
    (item) => (item.order_status || "pending").toLowerCase() === "pending"
  ).length;

  const processingOrders = allOrders.filter(
    (item) => (item.order_status || "").toLowerCase() === "processing"
  ).length;

  const paidOrders = allOrders.filter(
    (item) => (item.payment_status || "").toLowerCase() === "paid"
  ).length;

  const deliveredOrders = allOrders.filter(
    (item) => (item.order_status || "").toLowerCase() === "delivered"
  ).length;

  const cancelledOrders = allOrders.filter(
    (item) => (item.order_status || "").toLowerCase() === "cancelled"
  ).length;

  const totalRevenue = allOrders
    .filter((item) => (item.payment_status || "").toLowerCase() === "paid")
    .reduce(
      (sum, item) => sum + Number(item.total_amount || item.amount || 0),
      0
    );

  const latestOrder = allOrders[0];

  return (
    <main className="admin-orders-page responsive-admin-page" style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.badgeTop}>NEW DUBAI ADMIN SYSTEM</p>
          <h1 style={styles.title}>Orders Management</h1>
          <p style={styles.subtitle}>
            View customer orders, update delivery progress, and monitor payment
            status from one clean admin panel.
          </p>

          <Link href="/admin" style={styles.backHome}>
            <ArrowLeft size={18} />
            Back Home
          </Link>
        </div>

        <div style={styles.headerCard}>
          <div style={styles.headerIcon}>
            <PackageCheck size={28} />
          </div>

          <div>
            <p style={styles.headerCardLabel}>Order Workflow</p>
            <h2 style={styles.headerCardValue}>Pending → Processing → Delivered</h2>
            <p style={styles.headerCardText}>
              Admin can update order status and users can track their orders.
            </p>
          </div>
        </div>
      </section>

      {usedFallback && (
        <section style={styles.warningBox}>
          <strong>Fallback Mode:</strong> Orders table is empty, so this page is
          showing old payment records as temporary orders. These records cannot
          update order status until real orders are created.
        </section>
      )}

      <section className="responsive-stats-grid" style={styles.statsGrid}>
        <StatCard
          dark
          icon={<ShoppingBag size={24} />}
          title="Total Orders"
          value={totalOrders}
          sub="All order records"
        />

        <StatCard
          icon={<Clock3 size={24} />}
          title="Pending"
          value={pendingOrders}
          sub="Waiting confirmation"
        />

        <StatCard
          icon={<PackageCheck size={24} />}
          title="Processing"
          value={processingOrders}
          sub="Being prepared"
        />

        <StatCard
          icon={<Truck size={24} />}
          title="Delivered"
          value={deliveredOrders}
          sub="Completed orders"
        />

        <StatCard
          icon={<XCircle size={24} />}
          title="Cancelled"
          value={cancelledOrders}
          sub="Cancelled orders"
        />

        <StatCard
          icon={<CheckCircle2 size={24} />}
          title="Paid"
          value={paidOrders}
          sub="Payment completed"
        />

        <StatCard
          icon={<DollarSign size={24} />}
          title="Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          sub="Paid order value"
          wide
        />
      </section>

      <section className="responsive-split-layout" style={styles.contentGrid}>
        <div style={styles.tablePanel}>
          <div style={styles.panelTop}>
            <div>
              <h2 style={styles.panelTitle}>Orders Records</h2>
              <p style={styles.panelSub}>
                {invoiceFilter
                  ? `Showing order for invoice ${invoiceFilter}.`
                  : "Manage each customer order and update the delivery status."}
              </p>
            </div>

            <div style={styles.panelActions}>
              {invoiceFilter ? (
                <Link href="/admin/orders" style={styles.clearFilterBtn}>
                  Clear Filter
                </Link>
              ) : null}
              <span style={styles.countPill}>{allOrders.length} Records</span>
            </div>
          </div>

          {allOrders.length === 0 ? (
            <div style={styles.emptyBox}>
              <ShoppingBag size={42} color="#f5a400" />
              <h3 style={styles.emptyTitle}>No orders found</h3>
              <p style={styles.emptyText}>
                Orders will appear here after customers checkout.
              </p>
            </div>
          ) : (
            <div className="responsive-table-wrap" style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Invoice</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Payment</th>
                    <th style={styles.th}>Payment Status</th>
                    <th style={styles.th}>Order Status</th>
                    <th style={styles.th}>Source</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.thRight}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {allOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      style={{
                        ...styles.tr,
                        background: index % 2 === 0 ? "#ffffff" : "#fafafa",
                      }}
                    >
                      <td style={styles.td}>
                        <span style={styles.invoicePill}>
                          {order.invoice_no || order.order_invoice_no || "-"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.customerCell}>
                          <div style={styles.customerAvatar}>
                            {(order.customer_name || "C")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <strong style={styles.customerName}>
                            {order.customer_name || "-"}
                          </strong>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.phoneText}>
                          {order.customer_phone || "-"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <strong style={styles.amountText}>
                          $
                          {Number(
                            order.total_amount || order.amount || 0
                          ).toFixed(2)}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.methodPill}>
                          {order.payment_method || "-"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <StatusBadge status={order.payment_status || "pending"} />
                      </td>

                      <td style={styles.td}>
                        <div style={styles.statusBlock}>
                          <StatusBadge status={order.order_status || "pending"} />

                          {order.source !== "payments" ? (
                            <form
                              action={updateOrderStatus}
                              style={styles.statusForm}
                            >
                              <input
                                type="hidden"
                                name="orderId"
                                value={order.id}
                              />

                              <select
                                name="status"
                                defaultValue={order.order_status || "pending"}
                                style={styles.statusSelect}
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>

                              <button type="submit" style={styles.updateBtn}>
                                Update
                              </button>
                            </form>
                          ) : (
                            <p style={styles.fallbackText}>Fallback record</p>
                          )}
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.sourcePill,
                            background:
                              order.source === "payments" ? "#ffedd5" : "#dcfce7",
                            color:
                              order.source === "payments" ? "#9a3412" : "#166534",
                          }}
                        >
                          {order.source === "payments"
                            ? "Payments Fallback"
                            : "Orders"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.dateText}>
                          {order.created_at
                            ? new Date(order.created_at).toLocaleString()
                            : "-"}
                        </span>
                      </td>

                      <td style={styles.tdRight}>
                        <span style={styles.noDetails}>
                          {order.source === "payments"
                            ? "No Details"
                            : "Managed here"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside style={styles.sidePanel}>
          <div style={styles.sideHead}>
            <div style={styles.sideIcon}>
              <ReceiptText size={24} />
            </div>

            <div>
              <h2 style={styles.sideTitle}>Latest Order</h2>
              <p style={styles.sideSub}>Quick admin summary</p>
            </div>
          </div>

          {latestOrder ? (
            <div style={styles.latestBox}>
              <p style={styles.latestLabel}>Invoice</p>
              <h3 style={styles.latestName}>
                {latestOrder.invoice_no || latestOrder.order_invoice_no || "-"}
              </h3>

              <div style={styles.latestRows}>
                <div style={styles.latestRow}>
                  <span>Customer</span>
                  <strong>{latestOrder.customer_name || "-"}</strong>
                </div>

                <div style={styles.latestRow}>
                  <span>Phone</span>
                  <strong>{latestOrder.customer_phone || "-"}</strong>
                </div>

                <div style={styles.latestRow}>
                  <span>Amount</span>
                  <strong>
                    $
                    {Number(
                      latestOrder.total_amount || latestOrder.amount || 0
                    ).toFixed(2)}
                  </strong>
                </div>

                <div style={styles.latestRow}>
                  <span>Payment</span>
                  <StatusBadge status={latestOrder.payment_status || "pending"} />
                </div>

                <div style={styles.latestRow}>
                  <span>Order</span>
                  <StatusBadge status={latestOrder.order_status || "pending"} />
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.latestBox}>
              <p style={styles.latestLabel}>Latest Order</p>
              <h3 style={styles.latestName}>No record yet</h3>
            </div>
          )}

          <div style={styles.tipBox}>
         
          </div>
        </aside>
      </section>
    </main>
  );
}

function StatCard({ icon, title, value, sub, dark = false, wide = false }) {
  return (
    <div
      style={{
        ...styles.statCard,
        ...(dark ? styles.statCardDark : {}),
        ...(wide ? styles.statCardWide : {}),
      }}
    >
      <div
        style={{
          ...styles.statIcon,
          ...(dark ? styles.statIconDark : {}),
        }}
      >
        {icon}
      </div>

      <div>
        <p style={{ ...styles.statTitle, color: dark ? "#d4d4d8" : "#666" }}>
          {title}
        </p>
        <h2 style={{ ...styles.statValue, color: dark ? "#f5a400" : "#111" }}>
          {value}
        </h2>
        <p style={{ ...styles.statSub, color: dark ? "#aaa" : "#777" }}>{sub}</p>
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

  badgeTop: {
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
    maxWidth: "650px",
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

  headerCard: {
    minWidth: "330px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "22px",
    padding: "18px",
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },

  headerIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "18px",
    background: "#f5a400",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  headerCardLabel: {
    margin: 0,
    color: "#bbb",
    fontSize: "12px",
    fontWeight: "800",
  },

  headerCardValue: {
    margin: "5px 0 0",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "900",
  },

  headerCardText: {
    margin: "6px 0 0",
    color: "#aaa",
    fontSize: "12px",
    lineHeight: "18px",
    fontWeight: "700",
  },

  warningBox: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "14px 16px",
    borderRadius: "18px",
    marginBottom: "18px",
    fontSize: "13px",
    fontWeight: "800",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "18px",
    display: "flex",
    gap: "13px",
    alignItems: "flex-start",
    boxShadow: "0 12px 30px rgba(0,0,0,0.07)",
  },

  statCardDark: {
    background: "#070707",
    color: "#fff",
    border: "1px solid rgba(245,164,0,0.22)",
  },

  statCardWide: {
    gridColumn: "span 2",
  },

  statIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    background: "#fef3c7",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  statIconDark: {
    background: "#f5a400",
    color: "#000",
  },

  statTitle: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "900",
  },

  statValue: {
    margin: "5px 0 0",
    fontSize: "25px",
    fontWeight: "900",
  },

  statSub: {
    margin: "4px 0 0",
    fontSize: "12px",
    fontWeight: "700",
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 340px",
    gap: "18px",
    alignItems: "start",
  },

  tablePanel: {
    background: "#fff",
    borderRadius: "26px",
    padding: "22px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 18px 45px rgba(0,0,0,0.10)",
  },

  panelTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    marginBottom: "16px",
  },

  panelActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  panelTitle: {
    margin: 0,
    fontSize: "25px",
    fontWeight: "900",
  },

  panelSub: {
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

  clearFilterBtn: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },

  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
  },

  table: {
    width: "100%",
    minWidth: "1250px",
    borderCollapse: "collapse",
  },

  th: {
    background: "#070707",
    color: "#f5a400",
    padding: "14px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "uppercase",
  },

  thRight: {
    background: "#070707",
    color: "#f5a400",
    padding: "14px",
    textAlign: "right",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "uppercase",
  },

  tr: {
    borderBottom: "1px solid #eeeeee",
  },

  td: {
    padding: "14px",
    verticalAlign: "middle",
    fontSize: "14px",
    fontWeight: "700",
  },

  tdRight: {
    padding: "14px",
    verticalAlign: "middle",
    textAlign: "right",
    whiteSpace: "nowrap",
  },

  invoicePill: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  customerCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  customerAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "14px",
    background: "#070707",
    color: "#f5a400",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    flexShrink: 0,
  },

  customerName: {
    color: "#111",
    fontWeight: "900",
    maxWidth: "160px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  phoneText: {
    color: "#555",
    fontSize: "13px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  amountText: {
    color: "#111",
    fontSize: "16px",
    fontWeight: "900",
  },

  methodPill: {
    background: "#f4f4f5",
    color: "#111",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  statusBlock: {
    display: "grid",
    gap: "9px",
  },

  statusForm: {
    display: "grid",
    gap: "7px",
    minWidth: "150px",
  },

  statusSelect: {
    height: "38px",
    borderRadius: "12px",
    border: "1px solid #d4d4d8",
    background: "#fff",
    color: "#111",
    padding: "0 10px",
    fontSize: "12px",
    fontWeight: "900",
    outline: "none",
  },

  updateBtn: {
    height: "36px",
    border: "none",
    borderRadius: "12px",
    background: "#070707",
    color: "#f5a400",
    fontSize: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },

  fallbackText: {
    margin: 0,
    color: "#777",
    fontSize: "12px",
    fontWeight: "800",
  },

  sourcePill: {
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  dateText: {
    color: "#666",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  viewBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#1d4ed8",
    background: "#dbeafe",
    borderRadius: "13px",
    padding: "9px 11px",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "900",
  },

  noDetails: {
    color: "#888",
    fontSize: "12px",
    fontWeight: "900",
  },

  sidePanel: {
    background: "#070707",
    color: "#fff",
    borderRadius: "26px",
    padding: "22px",
    border: "1px solid rgba(245,164,0,0.22)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
    position: "sticky",
    top: "22px",
  },

  sideHead: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },

  sideIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "#f5a400",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  sideTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "22px",
    fontWeight: "900",
  },

  sideSub: {
    margin: "4px 0 0",
    color: "#aaa",
    fontSize: "12px",
    fontWeight: "700",
  },

  latestBox: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "20px",
    padding: "16px",
  },

  latestLabel: {
    margin: 0,
    color: "#f5a400",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "0.6px",
  },

  latestName: {
    margin: "8px 0 0",
    color: "#fff",
    fontSize: "20px",
    fontWeight: "900",
    wordBreak: "break-word",
  },

  latestRows: {
    marginTop: "14px",
    display: "grid",
    gap: "12px",
  },

  latestRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    color: "#ddd",
    fontSize: "13px",
    fontWeight: "700",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    paddingBottom: "10px",
  },

  tipBox: {
    marginTop: "14px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "20px",
    padding: "15px",
    color: "#111",
  },

  tipTitle: {
    margin: 0,
    color: "#92400e",
    fontSize: "15px",
    fontWeight: "900",
  },

  tipText: {
    margin: "8px 0 0",
    color: "#555",
    fontSize: "12px",
    lineHeight: "19px",
    fontWeight: "700",
  },

  emptyBox: {
    height: "360px",
    border: "1px dashed #ccc",
    borderRadius: "22px",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  emptyTitle: {
    margin: 0,
    color: "#111",
    fontSize: "22px",
    fontWeight: "900",
  },

  emptyText: {
    margin: 0,
    color: "#666",
    fontSize: "14px",
    fontWeight: "700",
  },

  errorBox: {
    minHeight: "360px",
    background: "#fff",
    border: "1px solid #fecaca",
    borderRadius: "26px",
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    boxShadow: "0 18px 45px rgba(0,0,0,0.10)",
  },

  errorTitle: {
    margin: 0,
    color: "#991b1b",
    fontSize: "28px",
    fontWeight: "900",
  },

  errorText: {
    margin: 0,
    color: "#666",
    fontSize: "14px",
    fontWeight: "700",
  },
};
