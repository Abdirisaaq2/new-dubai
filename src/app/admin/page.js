import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShoppingBag,
  FolderTree,
  Users,
  Package,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Boxes,
} from "lucide-react";
import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";
import AdminOldSidebar from "@/components/admin-old-sidebar";

function StatusBadge({ status }) {
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

  if (value === "paid") {
    return (
      <span style={{ ...styles.badge, background: "#dbeafe", color: "#1d4ed8" }}>
        Paid
      </span>
    );
  }

  return (
    <span style={{ ...styles.badge, background: "#fef3c7", color: "#92400e" }}>
      Pending
    </span>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, email, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");
  if (profile.status !== "active") redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard");

  const { count: productsCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  const supabaseAdmin = createAdminClient();

  const { data: profilesForCounts } = await supabaseAdmin
    .from("profiles")
    .select("id, role");

  const { data: authUsersData } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const roleById = new Map(
    (profilesForCounts || []).map((item) => [item.id, item.role || "user"])
  );

  const customersCount = (authUsersData?.users || []).filter(
    (authUser) => (roleById.get(authUser.id) || "user") === "user"
  ).length;

  const { count: categoriesCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });

  const { count: ordersCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { data: products } = await supabase
    .from("products")
    .select("id, name, category, stock, price")
    .order("created_at", { ascending: false });

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: recentPayments } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: allOrders } = await supabase
    .from("orders")
    .select("order_status, payment_status, total_amount");

  const { data: allPayments } = await supabase
    .from("payments")
    .select("amount, payment_status");

  const productList = products || [];
  const orderList = allOrders || [];
  const paymentList = allPayments || [];

  const pendingOrders = orderList.filter(
    (item) => (item.order_status || "pending").toLowerCase() === "pending"
  ).length;

  const processingOrders = orderList.filter(
    (item) => (item.order_status || "").toLowerCase() === "processing"
  ).length;

  const deliveredOrders = orderList.filter(
    (item) => (item.order_status || "").toLowerCase() === "delivered"
  ).length;

  const cancelledOrders = orderList.filter(
    (item) => (item.order_status || "").toLowerCase() === "cancelled"
  ).length;

  const inStockCount = productList.filter(
    (item) => Number(item.stock || 0) > 5
  ).length;

  const lowStockCount = productList.filter(
    (item) => Number(item.stock || 0) > 0 && Number(item.stock || 0) <= 5
  ).length;

  const outStockCount = productList.filter(
    (item) => Number(item.stock || 0) <= 0
  ).length;

  const totalRevenue = paymentList
    .filter((item) => (item.payment_status || "").toLowerCase() === "paid")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const categoryGroups = productList.reduce((acc, product) => {
    const key = product.category || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const categoryBars = Object.entries(categoryGroups).map(([label, value]) => ({
    label,
    value,
  }));

  const orderChartData = [
    { label: "Pending", value: pendingOrders, color: "#f5a400" },
    { label: "Processing", value: processingOrders, color: "#7e22ce" },
    { label: "Delivered", value: deliveredOrders, color: "#16a34a" },
    { label: "Cancelled", value: cancelledOrders, color: "#dc2626" },
  ];

  const stockChartData = [
    { label: "In Stock", value: inStockCount, color: "#16a34a" },
    { label: "Low Stock", value: lowStockCount, color: "#f5a400" },
    { label: "Out Stock", value: outStockCount, color: "#dc2626" },
  ];

  return (
    <main className="admin-dashboard-page" style={styles.page}>
      <div className="admin-dashboard-shell" style={styles.shell}>
        <AdminOldSidebar />

        <section style={styles.content}>
          <section style={styles.hero}>
            <div>
              <p style={styles.badgeTop}>NEW DUBAI ADMIN SYSTEM</p>
              <h1 style={styles.title}>Admin Dashboard</h1>
              <p style={styles.subtitle}>
                Welcome back, {profile.username || "Admin"}. Monitor products,
                customers, categories, orders and store activity from one
                professional control center.
              </p>
            </div>

            <div style={styles.heroCard}>
              <div style={styles.heroIcon}>
                <ShieldCheck size={28} />
              </div>

              <div>
                <p style={styles.heroLabel}>Admin Access</p>
                <h2 style={styles.heroValue}>Active System</h2>
                <p style={styles.heroText}>{profile.email}</p>
              </div>
            </div>
          </section>

          <section className="responsive-stats-grid" style={styles.statsGrid}>
            <MainCard
              href="/admin/products"
              icon={<Package size={25} />}
              title="Products"
              value={productsCount || 0}
              sub="Manage inventory"
              dark
            />

            <MainCard
              href="/admin/customers"
              icon={<Users size={25} />}
              title="Customers"
              value={customersCount || 0}
              sub="Registered users"
            />

            <MainCard
              href="/admin/categories"
              icon={<FolderTree size={25} />}
              title="Categories"
              value={categoriesCount || 0}
              sub="Product groups"
            />

            <MainCard
              href="/admin/orders"
              icon={<ShoppingBag size={25} />}
              title="Orders"
              value={ordersCount || 0}
              sub="Customer orders"
            />
          </section>

          <section className="responsive-three-grid" style={styles.chartsGrid}>
            <PieChartCard
              title="Orders Status Chart"
              subtitle="Pending, processing, delivered and cancelled orders"
              data={orderChartData}
              total={Number(ordersCount || 0)}
            />

            <PieChartCard
              title="Product Stock Chart"
              subtitle="Inventory health by available product quantity"
              data={stockChartData}
              total={productList.length}
            />

            <BarChartCard
              title="Category Products Chart"
              subtitle="Products grouped by category"
              data={categoryBars}
            />
          </section>

          <section className="responsive-two-grid" style={styles.summaryGrid}>
            <div style={styles.revenuePanel}>
              <div style={styles.revenueIcon}>
                <DollarSign size={28} />
              </div>

              <p style={styles.revenueLabel}>Total Revenue</p>
              <h2 style={styles.revenueValue}>${totalRevenue.toFixed(2)}</h2>
              <p style={styles.revenueText}>
                Calculated from paid payment records.
              </p>

              <Link href="/admin/payments" style={styles.revenueLink}>
                View Payments
                <ArrowRight size={16} />
              </Link>
            </div>

            <div style={styles.panel}>
              <div style={styles.panelTop}>
                <div>
                  <h2 style={styles.panelTitle}>Quick Actions</h2>
                  <p style={styles.panelSub}>Open admin tools fast</p>
                </div>
                <Boxes size={24} color="#f5a400" />
              </div>

              <div style={styles.quickGrid}>
                <QuickLink href="/admin/products" label="Products" />
                <QuickLink href="/admin/categories" label="Categories" />
                <QuickLink href="/admin/customers" label="Customers" />
                <QuickLink href="/admin/orders" label="Orders" />
                <QuickLink href="/admin/payments" label="Payments" />
                <QuickLink href="/admin/slides" label="Slides" />
              </div>
            </div>
          </section>

          <section className="responsive-two-grid" style={styles.bottomGrid}>
            <div style={styles.panel}>
              <div style={styles.panelTop}>
                <div>
                  <h2 style={styles.panelTitle}>Recent Orders</h2>
                  <p style={styles.panelSub}>Latest customer orders</p>
                </div>

                <Link href="/admin/orders" style={styles.smallLink}>
                  View All
                  <ArrowRight size={14} />
                </Link>
              </div>

              {!recentOrders || recentOrders.length === 0 ? (
                <div style={styles.emptyBox}>
                  <p>No recent orders found.</p>
                </div>
              ) : (
                <div style={styles.recordList}>
                  {recentOrders.map((order) => (
                    <div key={order.id} style={styles.recordItem}>
                      <div>
                        <h3 style={styles.recordTitle}>
                          {order.invoice_no || "-"}
                        </h3>
                        <p style={styles.recordText}>
                          {order.customer_name || "Customer"} • $
                          {Number(order.total_amount || 0).toFixed(2)}
                        </p>
                      </div>

                      <StatusBadge status={order.order_status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.panel}>
              <div style={styles.panelTop}>
                <div>
                  <h2 style={styles.panelTitle}>Latest Payments</h2>
                  <p style={styles.panelSub}>Recent payment records</p>
                </div>

                <Link href="/admin/payments" style={styles.smallLink}>
                  View All
                  <ArrowRight size={14} />
                </Link>
              </div>

              {!recentPayments || recentPayments.length === 0 ? (
                <div style={styles.emptyBox}>
                  <p>No recent payments found.</p>
                </div>
              ) : (
                <div style={styles.recordList}>
                  {recentPayments.map((payment) => (
                    <div key={payment.id} style={styles.recordItem}>
                      <div>
                        <h3 style={styles.recordTitle}>
                          {payment.order_invoice_no || payment.invoice_no || "-"}
                        </h3>
                        <p style={styles.recordText}>
                          {payment.customer_name || "Customer"} • $
                          {Number(payment.amount || 0).toFixed(2)}
                        </p>
                      </div>

                      <StatusBadge status={payment.payment_status || "Paid"} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function MainCard({ href, icon, title, value, sub, dark = false }) {
  return (
    <Link
      href={href}
      style={{
        ...styles.mainCard,
        ...(dark ? styles.mainCardDark : {}),
      }}
    >
      <div
        style={{
          ...styles.mainIcon,
          ...(dark ? styles.mainIconDark : {}),
        }}
      >
        {icon}
      </div>

      <div style={styles.mainCardText}>
        <h3 style={{ ...styles.mainValue, color: dark ? "#f5a400" : "#111" }}>
          {value}
        </h3>
        <p style={{ ...styles.mainTitle, color: dark ? "#fff" : "#111" }}>
          {title}
        </p>
        <span style={{ ...styles.mainSub, color: dark ? "#aaa" : "#666" }}>
          {sub}
        </span>
      </div>

      <ArrowRight size={18} color={dark ? "#f5a400" : "#111"} />
    </Link>
  );
}

function PieChartCard({ title, subtitle, data, total }) {
  const safeTotal = Number(total || 0);
  let current = 0;

  const gradientParts =
    safeTotal > 0
      ? data
          .filter((item) => Number(item.value || 0) > 0)
          .map((item) => {
            const start = current;
            const percent = (Number(item.value || 0) / safeTotal) * 100;
            current += percent;
            return `${item.color} ${start}% ${current}%`;
          })
          .join(", ")
      : "#e5e7eb 0% 100%";

  return (
    <div style={styles.chartCard}>
      <div style={styles.panelTop}>
        <div>
          <h2 style={styles.panelTitle}>{title}</h2>
          <p style={styles.panelSub}>{subtitle}</p>
        </div>
      </div>

      <div style={styles.pieWrap}>
        <div
          style={{
            ...styles.pieChart,
            background: `conic-gradient(${gradientParts})`,
          }}
        >
          <div style={styles.pieCenter}>
            <strong>{safeTotal}</strong>
            <span>Total</span>
          </div>
        </div>

        <div style={styles.legendList}>
          {data.map((item) => (
            <div key={item.label} style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: item.color }} />
              <span style={styles.legendLabel}>{item.label}</span>
              <strong style={styles.legendValue}>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarChartCard({ title, subtitle, data }) {
  const maxValue =
    data.length > 0
      ? Math.max(...data.map((item) => Number(item.value || 0)))
      : 1;

  return (
    <div style={styles.chartCard}>
      <div style={styles.panelTop}>
        <div>
          <h2 style={styles.panelTitle}>{title}</h2>
          <p style={styles.panelSub}>{subtitle}</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={styles.emptyBox}>
          <p>No category chart data found.</p>
        </div>
      ) : (
        <div style={styles.chartBars}>
          {data.map((item) => (
            <div key={item.label} style={styles.chartBarItem}>
              <div style={styles.chartBarTop}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>

              <div style={styles.chartBarTrack}>
                <div
                  style={{
                    ...styles.chartBarFill,
                    width: `${Math.max(
                      8,
                      (Number(item.value || 0) / Number(maxValue || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickLink({ href, label }) {
  return (
    <Link href={href} style={styles.quickLink}>
      {label}
      <ArrowRight size={15} />
    </Link>
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
  shell: {
    display: "flex",
    gap: "18px",
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  hero: {
    background:
      "radial-gradient(circle at top left, rgba(245,164,0,0.22), transparent 35%), #070707",
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
    fontSize: "36px",
    fontWeight: "900",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#aaa",
    fontSize: "14px",
    lineHeight: "22px",
    fontWeight: "700",
    maxWidth: "720px",
  },
  heroCard: {
    minWidth: "320px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "22px",
    padding: "18px",
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },
  heroIcon: {
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
  heroLabel: {
    margin: 0,
    color: "#bbb",
    fontSize: "12px",
    fontWeight: "800",
  },
  heroValue: {
    margin: "5px 0 0",
    color: "#fff",
    fontSize: "20px",
    fontWeight: "900",
  },
  heroText: {
    margin: "6px 0 0",
    color: "#aaa",
    fontSize: "12px",
    lineHeight: "18px",
    fontWeight: "700",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  mainCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "18px",
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    justifyContent: "space-between",
    textDecoration: "none",
    boxShadow: "0 12px 30px rgba(0,0,0,0.07)",
  },
  mainCardDark: {
    background: "#070707",
    border: "1px solid rgba(245,164,0,0.22)",
  },
  mainIcon: {
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
  mainIconDark: {
    background: "#f5a400",
    color: "#000",
  },
  mainCardText: {
    flex: 1,
  },
  mainValue: {
    margin: 0,
    fontSize: "27px",
    fontWeight: "900",
  },
  mainTitle: {
    margin: "4px 0 0",
    fontSize: "14px",
    fontWeight: "900",
  },
  mainSub: {
    display: "block",
    marginTop: "4px",
    fontSize: "12px",
    fontWeight: "700",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "18px",
  },
  chartCard: {
    background: "#fff",
    borderRadius: "26px",
    padding: "22px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 18px 45px rgba(0,0,0,0.10)",
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
    fontSize: "22px",
    fontWeight: "900",
  },
  panelSub: {
    margin: "5px 0 0",
    color: "#666",
    fontSize: "13px",
    fontWeight: "700",
  },
  pieWrap: {
    display: "grid",
    gridTemplateColumns: "170px 1fr",
    gap: "18px",
    alignItems: "center",
  },
  pieChart: {
    width: "170px",
    height: "170px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "inset 0 0 0 1px rgba(0,0,0,0.08), 0 18px 35px rgba(0,0,0,0.14)",
  },
  pieCenter: {
    width: "88px",
    height: "88px",
    borderRadius: "50%",
    background: "#070707",
    color: "#f5a400",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "4px solid #fff",
    boxShadow: "0 10px 22px rgba(0,0,0,0.20)",
  },
  legendList: {
    display: "grid",
    gap: "10px",
  },
  legendItem: {
    height: "40px",
    borderRadius: "14px",
    background: "#fafafa",
    border: "1px solid #eee",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  legendDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  legendLabel: {
    flex: 1,
    color: "#444",
    fontSize: "13px",
    fontWeight: "900",
  },
  legendValue: {
    color: "#111",
    fontSize: "14px",
    fontWeight: "900",
  },
  chartBars: {
    display: "grid",
    gap: "15px",
  },
  chartBarItem: {
    display: "grid",
    gap: "8px",
  },
  chartBarTop: {
    display: "flex",
    justifyContent: "space-between",
    color: "#333",
    fontSize: "13px",
    fontWeight: "900",
  },
  chartBarTrack: {
    height: "14px",
    borderRadius: "999px",
    background: "#f1f1f1",
    overflow: "hidden",
  },
  chartBarFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #f5a400, #070707)",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: "18px",
    marginBottom: "18px",
  },
  revenuePanel: {
    background: "#070707",
    color: "#fff",
    borderRadius: "26px",
    padding: "22px",
    border: "1px solid rgba(245,164,0,0.22)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
  },
  revenueIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#f5a400",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  revenueLabel: {
    margin: "18px 0 0",
    color: "#aaa",
    fontSize: "13px",
    fontWeight: "900",
  },
  revenueValue: {
    margin: "8px 0 0",
    color: "#f5a400",
    fontSize: "34px",
    fontWeight: "900",
  },
  revenueText: {
    margin: "8px 0 0",
    color: "#aaa",
    fontSize: "13px",
    lineHeight: "20px",
    fontWeight: "700",
  },
  revenueLink: {
    marginTop: "18px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#f5a400",
    color: "#000",
    textDecoration: "none",
    borderRadius: "14px",
    padding: "11px 14px",
    fontSize: "13px",
    fontWeight: "900",
  },
  panel: {
    background: "#fff",
    borderRadius: "26px",
    padding: "22px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 18px 45px rgba(0,0,0,0.10)",
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  quickLink: {
    background: "#070707",
    color: "#f5a400",
    borderRadius: "16px",
    padding: "14px",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
  },
  smallLink: {
    background: "#070707",
    color: "#f5a400",
    borderRadius: "999px",
    padding: "8px 11px",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "900",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  recordList: {
    display: "grid",
    gap: "11px",
  },
  recordItem: {
    border: "1px solid #eee",
    background: "#fafafa",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  recordTitle: {
    margin: 0,
    color: "#111",
    fontSize: "14px",
    fontWeight: "900",
  },
  recordText: {
    margin: "5px 0 0",
    color: "#666",
    fontSize: "12px",
    fontWeight: "700",
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
  emptyBox: {
    minHeight: "170px",
    border: "1px dashed #ccc",
    borderRadius: "20px",
    background: "#fafafa",
    color: "#666",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    textAlign: "center",
  },
};
