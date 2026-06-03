import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
  CalendarDays,
  Search,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

function StatusBadge({ status }) {
  const value = (status || "active").toLowerCase();

  if (value === "blocked") {
    return (
      <span style={{ ...styles.badge, background: "#fee2e2", color: "#991b1b" }}>
        Blocked
      </span>
    );
  }

  return (
    <span style={{ ...styles.badge, background: "#dcfce7", color: "#166534" }}>
      Active
    </span>
  );
}

export default async function ViewCustomersPage({ searchParams }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id, username, email, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminProfile) redirect("/login");

  if (adminProfile.status !== "active") redirect("/login");

  if (adminProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const query = (searchParams?.q || "").trim();

  const db = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : supabase;

  let { data: profiles, error } = await db
    .from("profiles")
    .select("id, username, email, phone, gender, role, status, created_at")
    .order("created_at", { ascending: false });

  if (error && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const retry = await supabase
      .from("profiles")
      .select("id, username, email, phone, gender, role, status, created_at")
      .order("created_at", { ascending: false });
    profiles = retry.data;
    error = retry.error;
  }

  let authUsersData = { users: [] };

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const result = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    authUsersData = result.data || { users: [] };
  }

  if (error) {
    return (
      <main className="admin-customers-page responsive-admin-page" style={styles.page}>
        <div style={styles.errorBox}>
          <h1 style={styles.errorTitle}>Failed to load customers.</h1>
          <p style={styles.errorText}>
            {error.message}
          </p>
          <Link href="/admin" style={styles.backHome}>
            <ArrowLeft size={18} />
            Back Home
          </Link>
        </div>
      </main>
    );
  }

  const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const profileOnlyCustomers = (profiles || []).filter(
    (profile) =>
      (profile.role || "user") !== "admin" &&
      !authUsersData?.users?.some((authUser) => authUser.id === profile.id)
  );

  const authCustomerList = (authUsersData?.users || [])
    .map((authUser) => {
      const profile = profilesById.get(authUser.id);
      const metadata = authUser.user_metadata || {};

      return {
        id: authUser.id,
        username:
          profile?.username ||
          metadata.username ||
          authUser.email?.split("@")[0] ||
          "Customer",
        email: profile?.email || authUser.email || "",
        phone: profile?.phone || metadata.phone || authUser.phone || "",
        gender: profile?.gender || metadata.gender || "",
        role: profile?.role || metadata.role || "user",
        status: profile?.status || metadata.status || "active",
        created_at: profile?.created_at || authUser.created_at,
      };
    })
    .filter((customer) => customer.role !== "admin");

  const customerList = [...authCustomerList, ...profileOnlyCustomers]
    .filter((customer) => {
      if (!query) return true;
      const text = query.toLowerCase();
      return (
        customer.username?.toLowerCase().includes(text) ||
        customer.email?.toLowerCase().includes(text) ||
        customer.phone?.toLowerCase().includes(text)
      );
    })
    .sort((a, b) => {
      const bTime = new Date(b?.created_at || 0).getTime();
      const aTime = new Date(a?.created_at || 0).getTime();
      return bTime - aTime;
    });

  const totalCustomers = customerList.length;

  const activeCustomers = customerList.filter(
    (customer) => (customer.status || "active").toLowerCase() === "active"
  ).length;

  const blockedCustomers = customerList.filter(
    (customer) => (customer.status || "").toLowerCase() === "blocked"
  ).length;

  const withPhone = customerList.filter((customer) => customer.phone).length;

  return (
    <main className="admin-customers-page responsive-admin-page" style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.topBadge}>NEW DUBAI ADMIN SYSTEM</p>
          <h1 style={styles.title}>View Customers</h1>
          <p style={styles.subtitle}>
            Manage and review registered customer profiles from one clean admin
            panel.
          </p>

          <Link href="/admin" style={styles.backHome}>
            <ArrowLeft size={18} />
            Back Home
          </Link>
        </div>

        <div style={styles.adminCard}>
          <div style={styles.adminIcon}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <p style={styles.adminLabel}>Admin Access</p>
            <h2 style={styles.adminName}>{adminProfile.username || "Admin"}</h2>
            <p style={styles.adminEmail}>{adminProfile.email}</p>
          </div>
        </div>
      </section>

      <section className="responsive-stats-grid" style={styles.statsGrid}>
        <StatCard
          title="Customers"
          value={totalCustomers}
          subtitle="Registered users"
          icon={<Users size={24} />}
          dark
        />

        <StatCard
          title="Active"
          value={activeCustomers}
          subtitle="Active accounts"
          icon={<UserCheck size={24} />}
        />

        <StatCard
          title="Blocked"
          value={blockedCustomers}
          subtitle="Blocked accounts"
          icon={<UserX size={24} />}
        />

        <StatCard
          title="With Phone"
          value={withPhone}
          subtitle="Phone numbers"
          icon={<Phone size={24} />}
        />
      </section>

      <section style={styles.panel}>
        <div style={styles.panelTop}>
          <div>
            <h2 style={styles.panelTitle}>Customers List</h2>
            <p style={styles.panelSub}>
              Search by customer name, email, or phone number.
            </p>
          </div>

          <form style={styles.searchForm}>
            <div style={styles.searchBox}>
              <Search size={18} color="#777" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search customers..."
                style={styles.searchInput}
              />
            </div>

            <button type="submit" style={styles.searchBtn}>
              Search
            </button>

            {query ? (
              <Link href="/admin/customers" style={styles.clearBtn}>
                Clear
              </Link>
            ) : null}
          </form>
        </div>

        {customerList.length === 0 ? (
          <div style={styles.emptyBox}>
            <Users size={42} color="#f5a400" />
            <h3 style={styles.emptyTitle}>No customers found</h3>
            <p style={styles.emptyText}>
              {query
                ? "No customer matched your search."
                : "No registered customers available yet."}
            </p>
          </div>
        ) : (
          <div style={styles.customersGrid}>
            {customerList.map((customer) => (
              <article key={customer.id} style={styles.customerCard}>
                <div style={styles.customerTop}>
                  <div style={styles.avatar}>
                    {(customer.username || customer.email || "U")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div style={styles.customerMain}>
                    <h3 style={styles.customerName}>
                      {customer.username || "Customer"}
                    </h3>
                    <p style={styles.customerRole}>Customer Account</p>
                  </div>

                  <StatusBadge status={customer.status} />
                </div>

                <div style={styles.infoList}>
                  <InfoRow
                    icon={<Mail size={16} />}
                    label="Email"
                    value={customer.email || "-"}
                  />

                  <InfoRow
                    icon={<Phone size={16} />}
                    label="Phone"
                    value={customer.phone || "-"}
                  />

                  <InfoRow
                    icon={<Users size={16} />}
                    label="Gender"
                    value={customer.gender || "-"}
                  />

                  <InfoRow
                    icon={<CalendarDays size={16} />}
                    label="Joined"
                    value={
                      customer.created_at
                        ? new Date(customer.created_at).toLocaleDateString()
                        : "-"
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ title, value, subtitle, icon, dark = false }) {
  return (
    <div style={{ ...styles.statCard, ...(dark ? styles.statCardDark : {}) }}>
      <div style={{ ...styles.statIcon, ...(dark ? styles.statIconDark : {}) }}>
        {icon}
      </div>

      <div>
        <h3 style={{ ...styles.statValue, color: dark ? "#f5a400" : "#111" }}>
          {value}
        </h3>
        <p style={{ ...styles.statTitle, color: dark ? "#fff" : "#111" }}>
          {title}
        </p>
        <span style={{ ...styles.statSub, color: dark ? "#aaa" : "#666" }}>
          {subtitle}
        </span>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={styles.infoRow}>
      <div style={styles.infoIcon}>{icon}</div>

      <div style={styles.infoText}>
        <p style={styles.infoLabel}>{label}</p>
        <p style={styles.infoValue}>{value}</p>
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

  topBadge: {
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

  adminCard: {
    minWidth: "320px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "22px",
    padding: "18px",
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },

  adminIcon: {
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

  adminLabel: {
    margin: 0,
    color: "#bbb",
    fontSize: "12px",
    fontWeight: "800",
  },

  adminName: {
    margin: "5px 0 0",
    color: "#fff",
    fontSize: "20px",
    fontWeight: "900",
  },

  adminEmail: {
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

  statCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "18px",
    display: "flex",
    gap: "14px",
    alignItems: "center",
    boxShadow: "0 12px 30px rgba(0,0,0,0.07)",
  },

  statCardDark: {
    background: "#070707",
    border: "1px solid rgba(245,164,0,0.22)",
  },

  statIcon: {
    width: "48px",
    height: "48px",
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

  statValue: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "900",
  },

  statTitle: {
    margin: "3px 0 0",
    fontSize: "14px",
    fontWeight: "900",
  },

  statSub: {
    display: "block",
    marginTop: "3px",
    fontSize: "12px",
    fontWeight: "700",
  },

  panel: {
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
    gap: "16px",
    marginBottom: "18px",
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

  searchForm: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  searchBox: {
    height: "44px",
    width: "280px",
    borderRadius: "15px",
    border: "1px solid #ddd",
    background: "#fafafa",
    padding: "0 13px",
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px",
    fontWeight: "700",
    color: "#111",
  },

  searchBtn: {
    height: "44px",
    border: "none",
    borderRadius: "15px",
    background: "#070707",
    color: "#f5a400",
    padding: "0 18px",
    fontSize: "14px",
    fontWeight: "900",
    cursor: "pointer",
  },

  clearBtn: {
    height: "44px",
    borderRadius: "15px",
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    padding: "0 16px",
    fontSize: "14px",
    fontWeight: "900",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  customersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: "16px",
  },

  customerCard: {
    border: "1px solid #eeeeee",
    background: "#fafafa",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  },

  customerTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },

  avatar: {
    width: "52px",
    height: "52px",
    borderRadius: "18px",
    background: "#070707",
    color: "#f5a400",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "900",
    flexShrink: 0,
  },

  customerMain: {
    flex: 1,
    minWidth: 0,
  },

  customerName: {
    margin: 0,
    color: "#111",
    fontSize: "19px",
    fontWeight: "900",
    wordBreak: "break-word",
  },

  customerRole: {
    margin: "4px 0 0",
    color: "#777",
    fontSize: "12px",
    fontWeight: "800",
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

  infoList: {
    display: "grid",
    gap: "10px",
  },

  infoRow: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: "16px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  infoIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "13px",
    background: "#fef3c7",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  infoText: {
    minWidth: 0,
  },

  infoLabel: {
    margin: 0,
    color: "#777",
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase",
  },

  infoValue: {
    margin: "3px 0 0",
    color: "#111",
    fontSize: "13px",
    fontWeight: "800",
    wordBreak: "break-word",
  },

  emptyBox: {
    minHeight: "360px",
    border: "1px dashed #ccc",
    borderRadius: "22px",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#444",
    textAlign: "center",
  },

  emptyTitle: {
    margin: "14px 0 0",
    color: "#111",
    fontSize: "24px",
    fontWeight: "900",
  },

  emptyText: {
    margin: "8px 0 0",
    color: "#666",
    fontSize: "14px",
    fontWeight: "700",
  },

  errorBox: {
    maxWidth: "900px",
    margin: "0 auto",
    borderRadius: "26px",
    border: "1px solid #fecaca",
    background: "#fff",
    padding: "26px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.10)",
  },

  errorTitle: {
    margin: 0,
    color: "#991b1b",
    fontSize: "28px",
    fontWeight: "900",
  },

  errorText: {
    margin: "10px 0 0",
    color: "#7f1d1d",
    fontSize: "14px",
    fontWeight: "700",
  },
};
