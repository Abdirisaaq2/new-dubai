import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  ExternalLink,
  Wallet,
  ReceiptText,
  DollarSign,
  CheckCircle2,
  Clock3,
  Truck,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabaseServer";

function PaymentBadge({ status }) {
  const value = (status || "Paid").toLowerCase();

  if (value === "paid" || value === "success" || value === "successful") {
    return (
      <span style={{ ...styles.badge, background: "#dcfce7", color: "#166534" }}>
        Paid
      </span>
    );
  }

  if (value === "failed") {
    return (
      <span style={{ ...styles.badge, background: "#fee2e2", color: "#991b1b" }}>
        Failed
      </span>
    );
  }

  return (
    <span style={{ ...styles.badge, background: "#ffedd5", color: "#9a3412" }}>
      Pending
    </span>
  );
}

function OrderBadge({ status }) {
  const value = (status || "pending").toLowerCase();

  if (value === "delivered") {
    return (
      <span style={{ ...styles.badge, background: "#dcfce7", color: "#166534" }}>
        Delivered
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

function compactDuplicatePayments(payments) {
  const latestByKey = new Map();
  const visiblePayments = [];
  const duplicateWindowMs = 30 * 60 * 1000;

  for (const payment of payments) {
    const amount = Number(payment.amount || 0).toFixed(2);
    const key = [
      payment.user_id || "",
      payment.customer_phone || "",
      (payment.customer_name || "").toLowerCase().trim(),
      (payment.payment_method || "").toLowerCase().trim(),
      amount,
    ].join("|");
    const paymentTime = new Date(payment.created_at || 0).getTime();
    const latestTime = latestByKey.get(key);

    if (latestTime && Math.abs(latestTime - paymentTime) <= duplicateWindowMs) {
      continue;
    }

    latestByKey.set(key, paymentTime);
    visiblePayments.push(payment);
  }

  return visiblePayments;
}

export default async function AdminPaymentsPage() {
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

  if (!profile || profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, invoice_no, order_status, customer_name, total_amount");

  const orderByInvoice = new Map(
    (orders || []).map((order) => [String(order.invoice_no || ""), order])
  );
  const orderById = new Map((orders || []).map((order) => [String(order.id), order]));

  const merged = (payments || []).map((payment) => {
    const order =
      orderById.get(String(payment.order_id || "")) ||
      orderByInvoice.get(String(payment.order_invoice_no || payment.invoice_no || ""));

    return {
      ...payment,
      order_id: order?.id || null,
      order_status: order?.order_status || "pending",
      order_customer_name: order?.customer_name || null,
      order_total_amount: order?.total_amount || null,
    };
  });

  const visiblePayments = compactDuplicatePayments(merged);

  const totalPayments = visiblePayments.length;

  const paidPayments = visiblePayments.filter(
    (item) => (item.payment_status || "").toLowerCase() === "paid"
  ).length;

  const pendingOrders = visiblePayments.filter(
    (item) => (item.order_status || "pending").toLowerCase() === "pending"
  ).length;

  const deliveredOrders = visiblePayments.filter(
    (item) => (item.order_status || "").toLowerCase() === "delivered"
  ).length;

  const totalAmount = visiblePayments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const latestPayment = visiblePayments[0];

  return (
    <main className="admin-payments-page responsive-admin-page" style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.badgeTop}>NEW DUBAI ADMIN SYSTEM</p>
          <h1 style={styles.title}>Payments Overview</h1>
          <p style={styles.subtitle}>
            Monitor customer payments, invoices, revenue and connected order status.
          </p>

          <Link href="/admin" style={styles.backHome}>
            <ArrowLeft size={18} />
            Back Home
          </Link>
        </div>

        <div style={styles.headerCard}>
          <div style={styles.headerIcon}>
            <ShieldCheck size={28} />
          </div>

          <div>
            <p style={styles.headerCardLabel}>Secure Payment Records</p>
            <h2 style={styles.headerCardValue}>Live Admin View</h2>
            <p style={styles.headerCardText}>
              Payments are matched with orders using invoice numbers.
            </p>
          </div>
        </div>
      </section>

      {(paymentsError || ordersError) && (
        <section style={styles.errorBox}>
          {paymentsError ? <p>Payments error: {paymentsError.message}</p> : null}
          {ordersError ? <p>Orders error: {ordersError.message}</p> : null}
        </section>
      )}

      <section className="responsive-stats-grid" style={styles.statsGrid}>
        <StatCard
          dark
          icon={<CreditCard size={24} />}
          title="Total Payments"
          value={totalPayments}
          sub="All payment records"
        />

        <StatCard
          icon={<DollarSign size={24} />}
          title="Total Revenue"
          value={`$${totalAmount.toFixed(2)}`}
          sub="Revenue from payments"
        />

        <StatCard
          icon={<CheckCircle2 size={24} />}
          title="Paid"
          value={paidPayments}
          sub="Successful payments"
        />

        <StatCard
          icon={<Clock3 size={24} />}
          title="Pending Orders"
          value={pendingOrders}
          sub="Waiting processing"
        />

        <StatCard
          icon={<Truck size={24} />}
          title="Delivered"
          value={deliveredOrders}
          sub="Completed orders"
        />
      </section>

      <section className="responsive-split-layout" style={styles.contentGrid}>
        <div style={styles.tablePanel}>
          <div style={styles.panelTop}>
            <div>
              <h2 style={styles.panelTitle}>Payments Records</h2>
              <p style={styles.panelSub}>
                Full list of customer payment records with connected order status.
              </p>
            </div>

            <span style={styles.countPill}>{visiblePayments.length} Records</span>
          </div>

          {visiblePayments.length === 0 ? (
            <div style={styles.emptyBox}>
              <Wallet size={42} color="#f5a400" />
              <h3 style={styles.emptyTitle}>No payments found</h3>
              <p style={styles.emptyText}>
                Payments will appear here after customers complete checkout.
              </p>
            </div>
          ) : (
            <div className="responsive-table-wrap" style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Invoice</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Method</th>
                    <th style={styles.th}>Payment</th>
                    <th style={styles.th}>Order</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.thRight}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {visiblePayments.map((payment, index) => (
                    <tr
                      key={payment.id}
                      style={{
                        ...styles.tr,
                        background: index % 2 === 0 ? "#ffffff" : "#fafafa",
                      }}
                    >
                      <td style={styles.td}>
                        <div style={styles.customerCell}>
                          <div style={styles.customerAvatar}>
                            {(payment.customer_name || "C")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong style={styles.customerName}>
                              {payment.customer_name || "Unknown Customer"}
                            </strong>
                            <p style={styles.customerPhone}>
                              {payment.customer_phone || "No phone"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.invoicePill}>
                          {payment.order_invoice_no || payment.invoice_no || "-"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <strong style={styles.amountText}>
                          ${Number(payment.amount || 0).toFixed(2)}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.methodPill}>
                          {payment.payment_method || "Mobile Money"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <PaymentBadge status={payment.payment_status} />
                      </td>

                      <td style={styles.td}>
                        <OrderBadge status={payment.order_status} />
                      </td>

                      <td style={styles.td}>
                        <span style={styles.dateText}>
                          {payment.created_at
                            ? new Date(payment.created_at).toLocaleString()
                            : "-"}
                        </span>
                      </td>

                      <td style={styles.tdRight}>
                        {payment.order_id ? (
                          <Link
                            href={`/admin/orders?invoice=${encodeURIComponent(
                              payment.order_invoice_no || payment.invoice_no || ""
                            )}`}
                            style={styles.viewBtn}
                          >
                            View Order
                            <ExternalLink size={14} />
                          </Link>
                        ) : (
                          <span style={styles.noOrder}>No Order</span>
                        )}
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
              <h2 style={styles.sideTitle}>Payment Summary</h2>
              <p style={styles.sideSub}>Latest transaction overview</p>
            </div>
          </div>

          {latestPayment ? (
            <div style={styles.latestBox}>
              <p style={styles.latestLabel}>Latest Payment</p>

              <h3 style={styles.latestName}>
                {latestPayment.customer_name || "Customer"}
              </h3>

              <div style={styles.latestRows}>
                <div style={styles.latestRow}>
                  <span>Invoice</span>
                  <strong>
                    {latestPayment.order_invoice_no ||
                      latestPayment.invoice_no ||
                      "-"}
                  </strong>
                </div>

                <div style={styles.latestRow}>
                  <span>Amount</span>
                  <strong>${Number(latestPayment.amount || 0).toFixed(2)}</strong>
                </div>

                <div style={styles.latestRow}>
                  <span>Method</span>
                  <strong>{latestPayment.payment_method || "-"}</strong>
                </div>

                <div style={styles.latestRow}>
                  <span>Order Status</span>
                  <OrderBadge status={latestPayment.order_status} />
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.latestBox}>
              <p style={styles.latestLabel}>Latest Payment</p>
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

function StatCard({ icon, title, value, sub, dark = false }) {
  return (
    <div
      style={{
        ...styles.statCard,
        ...(dark ? styles.statCardDark : {}),
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
    minWidth: "320px",
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
    fontSize: "20px",
    fontWeight: "900",
  },

  headerCardText: {
    margin: "6px 0 0",
    color: "#aaa",
    fontSize: "12px",
    lineHeight: "18px",
    fontWeight: "700",
  },

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "18px",
    padding: "14px 16px",
    marginBottom: "18px",
    fontWeight: "800",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
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
    fontSize: "26px",
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

  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
  },

  table: {
    width: "100%",
    minWidth: "1050px",
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

  customerCell: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  customerAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "15px",
    background: "#070707",
    color: "#f5a400",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    flexShrink: 0,
  },

  customerName: {
    display: "block",
    color: "#111",
    fontWeight: "900",
  },

  customerPhone: {
    margin: "4px 0 0",
    color: "#777",
    fontSize: "12px",
    fontWeight: "700",
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

  noOrder: {
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
};
