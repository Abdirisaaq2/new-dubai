import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Phone,
  CalendarDays,
  Lock,
  KeyRound,
} from "lucide-react";
import { createClient } from "@/lib/supabaseServer";

const MAIN_ADMIN_EMAIL = "carwonewdubai20@gmail.com";

async function updateUser(formData) {
  "use server";

  const userId = formData.get("userId");
  const role = formData.get("role");
  const status = formData.get("status");
  const canManageUsersValue = formData.get("canManageUsers");

  if (!userId || !role || !status) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id, email, role, status, can_manage_users")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminProfile || adminProfile.status !== "active") {
    redirect("/login");
  }

  if (adminProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const currentEmail = String(adminProfile.email || "").toLowerCase();
  const isMainAdmin = currentEmail === MAIN_ADMIN_EMAIL.toLowerCase();
  const currentAdminCanManage = Boolean(adminProfile.can_manage_users);

  /*
    Main admin ama admin Actions Access leh ayaa update samayn kara.
  */
  if (!isMainAdmin && !currentAdminCanManage) {
    console.log("Permission denied: this admin has no Actions Access.");
    return;
  }

  const { data: targetUser, error: targetError } = await supabase
    .from("profiles")
    .select("id, email, role, status, can_manage_users")
    .eq("id", userId)
    .maybeSingle();

  if (targetError || !targetUser) return;

  const targetEmail = String(targetUser.email || "").toLowerCase();
  const targetIsMainAdmin = targetEmail === MAIN_ADMIN_EMAIL.toLowerCase();
  const targetIsCurrentAdmin = targetUser.id === adminProfile.id;

  /*
    Admin kasta naftiisa ma beddeli karo.
  */
  if (targetIsCurrentAdmin) {
    console.log("Permission denied: admins cannot update their own account.");
    return;
  }

  /*
    Admin kale main admin ma beddeli karo.
  */
  if (!isMainAdmin && targetIsMainAdmin) {
    console.log("Permission denied: delegated admins cannot update main admin.");
    return;
  }

  const payload = {
    role,
    status,
  };

  /*
    Actions Access allowed/locked waxaa beddeli kara main admin kaliya.
    Admin kale role/status kaliya ayuu beddeli karaa.
  */
  if (isMainAdmin && canManageUsersValue !== null) {
    payload.can_manage_users = canManageUsersValue === "true";
  }

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);

  if (error) {
    console.log("Update user error:", error.message);
    return;
  }

  revalidatePath("/admin/users");
}

function RoleBadge({ role }) {
  const value = (role || "user").toLowerCase();

  if (value === "admin") {
    return (
      <span style={{ ...styles.badge, background: "#fef3c7", color: "#92400e" }}>
        Admin
      </span>
    );
  }

  return (
    <span style={{ ...styles.badge, background: "#e0f2fe", color: "#075985" }}>
      User
    </span>
  );
}

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

function AccessBadge({ canManageUsers, isMainAdmin }) {
  if (isMainAdmin) {
    return (
      <span style={{ ...styles.badge, background: "#111827", color: "#f5a400" }}>
        Main Admin
      </span>
    );
  }

  if (canManageUsers) {
    return (
      <span style={{ ...styles.badge, background: "#dcfce7", color: "#166534" }}>
        Allowed
      </span>
    );
  }

  return (
    <span style={{ ...styles.badge, background: "#f4f4f5", color: "#52525b" }}>
      Locked
    </span>
  );
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id, username, email, role, status, can_manage_users")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminProfile || adminProfile.status !== "active") {
    redirect("/login");
  }

  if (adminProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const currentEmail = String(adminProfile.email || "").toLowerCase();
  const isMainAdmin = currentEmail === MAIN_ADMIN_EMAIL.toLowerCase();
  const currentAdminCanManage =
    isMainAdmin || Boolean(adminProfile.can_manage_users);

  const { data: users, error } = await supabase
    .from("profiles")
    .select(
      "id, username, email, phone, gender, role, status, can_manage_users, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main style={styles.page}>
        <section style={styles.errorBox}>
          <h1 style={styles.errorTitle}>Failed to load users</h1>
          <p style={styles.errorText}>{error.message}</p>
          <Link href="/admin" style={styles.backHome}>
            <ArrowLeft size={18} />
            Back Home
          </Link>
        </section>
      </main>
    );
  }

  const allUsers = users || [];

  const totalUsers = allUsers.length;
  const adminUsers = allUsers.filter((item) => item.role === "admin").length;
  const activeUsers = allUsers.filter(
    (item) => (item.status || "active") === "active"
  ).length;
  const blockedUsers = allUsers.filter(
    (item) => item.status === "blocked"
  ).length;

  const actionAdmins = allUsers.filter(
    (item) =>
      item.role === "admin" &&
      (item.can_manage_users ||
        String(item.email || "").toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase())
  ).length;

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.badgeTop}>NEW DUBAI ADMIN SYSTEM</p>
          <h1 style={styles.title}>Manage Users</h1>
          <p style={styles.subtitle}>
            Control users, roles, account status, and delegated admin action access.
          </p>

          <Link href="/admin" style={styles.backHome}>
            <ArrowLeft size={18} />
            Back Home
          </Link>
        </div>

        <div style={styles.headerCard}>
          <div style={styles.headerIcon}>
            {currentAdminCanManage ? <ShieldCheck size={28} /> : <Lock size={28} />}
          </div>

          <div>
            <p style={styles.headerCardLabel}>Admin Security</p>
            <h2 style={styles.headerCardValue}>
              {isMainAdmin
                ? "Main Admin Access"
                : currentAdminCanManage
                ? "Delegated Actions Access"
                : "View Only Access"}
            </h2>
            <p style={styles.headerCardText}>
              {isMainAdmin
                ? "You can manage roles, status, and grant or revoke Actions Access for other admins."
                : currentAdminCanManage
                ? "You can update role/status for other users, but you cannot update yourself or the main admin."
                : "You can view users, but role/status actions are locked."}
            </p>
          </div>
        </div>
      </section>

      {isMainAdmin ? (
        <section style={styles.noticeBox}>
          <div style={styles.noticeIcon}>
            <KeyRound size={22} />
          </div>
          <div>
            <h3 style={styles.noticeTitle}>Main admin control enabled</h3>
            <p style={styles.noticeText}>
              You can give another admin Actions Access by changing{" "}
              <strong>Actions Access</strong> to <strong>Allowed</strong>. You can
              remove it again by changing it to <strong>Locked</strong>. Your own
              main admin row is protected.
            </p>
          </div>
        </section>
      ) : (
        <section style={styles.noticeBox}>
          <div style={styles.noticeIcon}>
            {currentAdminCanManage ? <KeyRound size={22} /> : <Lock size={22} />}
          </div>
          <div>
            <h3 style={styles.noticeTitle}>
              {currentAdminCanManage
                ? "Delegated admin access is enabled"
                : "Protected admin control"}
            </h3>
            <p style={styles.noticeText}>
              {currentAdminCanManage
                ? "Main admin allowed this account to use Actions. You cannot update yourself, the main admin, or grant Actions Access to others."
                : `Actions are locked. Only ${MAIN_ADMIN_EMAIL} can grant or revoke Actions Access.`}
            </p>
          </div>
        </section>
      )}

      <section style={styles.statsGrid}>
        <StatCard
          dark
          icon={<Users size={24} />}
          title="Total Users"
          value={totalUsers}
          sub="All registered accounts"
        />

        <StatCard
          icon={<ShieldCheck size={24} />}
          title="Admins"
          value={adminUsers}
          sub="Admin access accounts"
        />

        <StatCard
          icon={<KeyRound size={24} />}
          title="Actions Access"
          value={actionAdmins}
          sub="Admins allowed to update"
        />

        <StatCard
          icon={<UserX size={24} />}
          title="Blocked"
          value={blockedUsers}
          sub="Access restricted"
        />
      </section>

      <section style={styles.panel}>
        <div style={styles.panelTop}>
          <div>
            <h2 style={styles.panelTitle}>Users Records</h2>
            <p style={styles.panelSub}>
              {isMainAdmin
                ? "Main admin can update other users and manage Actions Access."
                : currentAdminCanManage
                ? "You can update role/status for allowed users. Your account and main admin are protected."
                : "Users are visible here. Actions are locked for this admin."}
            </p>
          </div>

          <span style={styles.countPill}>{totalUsers} Users</span>
        </div>

        {allUsers.length === 0 ? (
          <div style={styles.emptyBox}>
            <Users size={42} color="#f5a400" />
            <h3 style={styles.emptyTitle}>No users found</h3>
            <p style={styles.emptyText}>
              Registered users will appear here after sign up.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>Gender</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions Access</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.thRight}>Action</th>
                </tr>
              </thead>

              <tbody>
                {allUsers.map((item, index) => {
                  const username = item.username || "Unknown User";
                  const firstLetter = username.charAt(0).toUpperCase();
                  const itemEmail = String(item.email || "").toLowerCase();

                  const rowIsMainAdmin =
                    itemEmail === MAIN_ADMIN_EMAIL.toLowerCase();

                  const rowIsCurrentAdmin = item.id === adminProfile.id;

                  /*
                    Main admin:
                    - qof kasta oo kale wuu edit-gareyn karaa
                    - naftiisa ma edit-gareyn karo

                    Delegated admin:
                    - qof kasta oo kale wuu edit-gareyn karaa haddii allowed yahay
                    - naftiisa ma edit-gareyn karo
                    - main admin ma edit-gareyn karo
                  */
                  const canEditThisRow = isMainAdmin
                    ? !rowIsCurrentAdmin
                    : currentAdminCanManage &&
                      !rowIsMainAdmin &&
                      !rowIsCurrentAdmin;

                  const canEditActionsAccess =
                    isMainAdmin && !rowIsMainAdmin && !rowIsCurrentAdmin;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        ...styles.tr,
                        background: index % 2 === 0 ? "#ffffff" : "#fafafa",
                      }}
                    >
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div
                            style={{
                              ...styles.avatar,
                              ...(rowIsMainAdmin ? styles.mainAvatar : {}),
                              ...(rowIsCurrentAdmin && !rowIsMainAdmin
                                ? styles.selfAvatar
                                : {}),
                            }}
                          >
                            {firstLetter}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <strong style={styles.username}>{username}</strong>
                            <p style={styles.userId}>
                              ID: {String(item.id).slice(0, 8)}
                              {rowIsCurrentAdmin ? " • You" : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.contactBox}>
                          <p style={styles.contactLine}>
                            <Mail size={14} />
                            {item.email || "No email"}
                          </p>

                          <p style={styles.contactLine}>
                            <Phone size={14} />
                            {item.phone || "No phone"}
                          </p>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.genderPill}>
                          {item.gender || "Not set"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <RoleBadge role={item.role} />
                      </td>

                      <td style={styles.td}>
                        <StatusBadge status={item.status} />
                      </td>

                      <td style={styles.td}>
                        <AccessBadge
                          canManageUsers={Boolean(item.can_manage_users)}
                          isMainAdmin={rowIsMainAdmin}
                        />
                      </td>

                      <td style={styles.td}>
                        <span style={styles.dateText}>
                          <CalendarDays size={14} />
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString()
                            : "-"}
                        </span>
                      </td>

                      <td style={styles.tdRight}>
                        <form action={updateUser} style={styles.actionForm}>
                          <input type="hidden" name="userId" value={item.id} />

                          <select
                            name="role"
                            defaultValue={item.role || "user"}
                            disabled={!canEditThisRow}
                            style={{
                              ...styles.select,
                              ...(!canEditThisRow ? styles.disabledSelect : {}),
                            }}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>

                          <select
                            name="status"
                            defaultValue={item.status || "active"}
                            disabled={!canEditThisRow}
                            style={{
                              ...styles.select,
                              ...(!canEditThisRow ? styles.disabledSelect : {}),
                            }}
                          >
                            <option value="active">active</option>
                            <option value="blocked">blocked</option>
                          </select>

                          {isMainAdmin ? (
                            <select
                              name="canManageUsers"
                              defaultValue={
                                rowIsMainAdmin || item.can_manage_users
                                  ? "true"
                                  : "false"
                              }
                              disabled={!canEditActionsAccess}
                              style={{
                                ...styles.select,
                                ...(!canEditActionsAccess
                                  ? styles.disabledSelect
                                  : {}),
                              }}
                            >
                              <option value="false">locked</option>
                              <option value="true">allowed</option>
                            </select>
                          ) : (
                            <input
                              type="hidden"
                              name="canManageUsers"
                              value={item.can_manage_users ? "true" : "false"}
                            />
                          )}

                          <button
                            type="submit"
                            disabled={!canEditThisRow}
                            style={{
                              ...styles.saveBtn,
                              ...(!canEditThisRow ? styles.disabledBtn : {}),
                            }}
                          >
                            {canEditThisRow ? "Save" : "Locked"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ icon, title, value, sub, dark = false }) {
  return (
    <div style={{ ...styles.statCard, ...(dark ? styles.statCardDark : {}) }}>
      <div style={{ ...styles.statIcon, ...(dark ? styles.statIconDark : {}) }}>
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

  noticeBox: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#7c2d12",
    borderRadius: "22px",
    padding: "16px",
    marginBottom: "18px",
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
  },

  noticeIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "15px",
    background: "#f5a400",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  noticeTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "900",
  },

  noticeText: {
    margin: "5px 0 0",
    fontSize: "13px",
    lineHeight: "20px",
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

  panel: {
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
    minWidth: "1280px",
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

  userCell: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "16px",
    background: "#070707",
    color: "#f5a400",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    flexShrink: 0,
  },

  mainAvatar: {
    background: "#f5a400",
    color: "#000",
    boxShadow: "0 10px 22px rgba(245,164,0,0.30)",
  },

  selfAvatar: {
    border: "2px solid #f5a400",
  },

  username: {
    display: "block",
    color: "#111",
    fontWeight: "900",
    maxWidth: "180px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  userId: {
    margin: "4px 0 0",
    color: "#777",
    fontSize: "11px",
    fontWeight: "700",
  },

  contactBox: {
    display: "grid",
    gap: "6px",
  },

  contactLine: {
    margin: 0,
    color: "#555",
    fontSize: "12px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    maxWidth: "230px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  genderPill: {
    background: "#f4f4f5",
    color: "#111",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "capitalize",
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
    textTransform: "capitalize",
  },

  dateText: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#666",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  actionForm: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",
  },

  select: {
    height: "40px",
    borderRadius: "13px",
    border: "1px solid #d4d4d8",
    background: "#fff",
    color: "#111",
    padding: "0 10px",
    fontSize: "13px",
    fontWeight: "900",
    outline: "none",
  },

  disabledSelect: {
    background: "#f4f4f5",
    color: "#777",
    cursor: "not-allowed",
    opacity: 0.75,
  },

  saveBtn: {
    height: "40px",
    border: "none",
    borderRadius: "13px",
    background: "#f5a400",
    color: "#000",
    padding: "0 14px",
    fontSize: "13px",
    fontWeight: "900",
    cursor: "pointer",
  },

  disabledBtn: {
    background: "#d4d4d8",
    color: "#666",
    cursor: "not-allowed",
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
    margin: "10px 0 0",
    color: "#666",
    fontSize: "14px",
    fontWeight: "700",
  },
};