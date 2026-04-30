import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabaseServer";
import AdminShell from "@/components/admin-shell";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, email, role, status")
    .eq("email", user.email)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, customer_email, invoice_no, product_id, product_qty, product_size, status, created_at"
    )
    .order("created_at", { ascending: false });

  const safeOrders = orders || [];

  return (
    <AdminShell adminName={profile.username || "Admin"}>
      <div className="border border-black/10 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-5 bg-black" />

        <div className="p-6">
          <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-4xl font-bold">Orders</h2>
              <p className="mt-2 text-zinc-600">
                Manage and review all customer orders.
              </p>
            </div>

            <Link
              href="/admin"
              className="rounded-xl border border-black px-4 py-3 font-semibold hover:bg-black hover:text-white"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="rounded-xl overflow-hidden border border-zinc-200 bg-white shadow-sm">
            <div className="bg-sky-500 text-white px-5 py-3 flex items-center gap-2">
              <ClipboardList size={18} />
              <h3 className="font-bold">All Orders</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#fff8e7]">
                  <tr>
                    <th className="text-left px-4 py-3">Order no</th>
                    <th className="text-left px-4 py-3">Customer Email</th>
                    <th className="text-left px-4 py-3">Invoice No</th>
                    <th className="text-left px-4 py-3">Product ID</th>
                    <th className="text-left px-4 py-3">Qty</th>
                    <th className="text-left px-4 py-3">Size</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Created At</th>
                  </tr>
                </thead>

                <tbody>
                  {safeOrders.length > 0 ? (
                    safeOrders.map((order) => (
                      <tr key={order.id} className="border-t border-zinc-200">
                        <td className="px-4 py-3">{order.id}</td>
                        <td className="px-4 py-3">{order.customer_email || "-"}</td>
                        <td className="px-4 py-3">{order.invoice_no || "-"}</td>
                        <td className="px-4 py-3">{order.product_id || "-"}</td>
                        <td className="px-4 py-3">{order.product_qty || "-"}</td>
                        <td className="px-4 py-3">{order.product_size || "-"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === "Complete"
                                ? "bg-green-100 text-green-700"
                                : order.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {order.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-zinc-200">
                      <td className="px-4 py-4 text-zinc-500" colSpan="8">
                        No orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}