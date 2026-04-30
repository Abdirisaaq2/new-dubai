"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  Shapes,
  Tags,
  Users,
  ClipboardList,
  CreditCard,
  UserRound,
  LogOut,
  Menu,
  ChevronLeft,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, active: true },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categories", icon: Shapes },
  { href: "/admin/slides", label: "Slides", icon: Tags },
  { href: "/admin/customers", label: "View Customers", icon: Users },
  { href: "/admin/payments", label: "View Payments", icon: CreditCard },
  { href: "/admin/users", label: "Users", icon: UserRound },
];

export default function AdminOldSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`admin-sidebar w-full shrink-0 rounded-2xl bg-black text-white shadow-lg transition-all duration-300 lg:w-auto ${
        collapsed ? "lg:w-[92px] p-3" : "lg:w-[260px] p-4 sm:p-5"
      }`}
    >
      <div className="mb-6 border-b border-yellow-500/30 pb-4">
        <div className={`flex items-start ${collapsed ? "justify-center" : "justify-between"} gap-2`}>
          {!collapsed ? (
            <div>
              <h2 className="text-2xl font-bold text-yellow-500">Admin Area</h2>
              <p className="mt-1 text-sm text-zinc-400">New Dubai Fashion</p>
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500 text-xl font-bold text-black">
              A
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-xl bg-zinc-900 p-2 text-yellow-500 transition hover:bg-zinc-800"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-xl px-4 py-3 transition ${
                collapsed ? "lg:justify-center gap-3" : "gap-3"
              } ${
                item.active
                  ? "bg-yellow-500 font-semibold text-black"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
              title={collapsed ? item.label : ""}
            >
              <Icon size={18} />
              <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
            </Link>
          );
        })}

        <Link
          href="/admin/orders"
          className={`flex items-center rounded-xl px-4 py-3 transition ${
            collapsed ? "lg:justify-center gap-3" : "gap-3"
          } text-zinc-300 hover:bg-zinc-900 hover:text-white`}
          title={collapsed ? "View Orders" : ""}
        >
          <ClipboardList size={18} />
          <span className={collapsed ? "lg:hidden" : ""}>View Orders</span>
        </Link>
      </div>

      {!collapsed && (
        <div className="mt-6 rounded-xl border border-yellow-500/20 bg-zinc-950 p-4">
          <p className="text-sm font-semibold text-yellow-500">Admin</p>
          <p className="mt-1 text-xs text-zinc-400">Administrator</p>
        </div>
      )}

      <form action="/auth/signout" method="post" className="mt-4">
        <button
          className={`flex w-full items-center justify-center rounded-xl bg-yellow-500 py-3 font-semibold text-black transition hover:opacity-90 ${
            collapsed ? "" : "gap-2"
          }`}
          title={collapsed ? "Log Out" : ""}
        >
          <LogOut size={18} />
          {!collapsed && <span>Log Out</span>}
        </button>
      </form>
    </div>
  );
}
