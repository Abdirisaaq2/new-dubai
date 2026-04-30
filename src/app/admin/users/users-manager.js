"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminSkeleton from "@/components/admin-skeleton";

export default function AdminUsersManager() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to load users");
      setLoading(false);
      return;
    }

    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => {
    Promise.resolve().then(() => loadUsers());
  }, []);

  async function updateUser(id, updates) {
    setMessage("");

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, ...updates }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to update user");
      return;
    }

    setMessage("User updated successfully.");
    loadUsers();
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-yellow-500">Manage Users</h1>
        <Link
          href="/admin"
          className="border border-yellow-500 text-yellow-500 px-4 py-2 rounded-lg"
        >
          Back to Admin
        </Link>
      </div>

      {message && <p className="mb-4 text-sm text-yellow-400">{message}</p>}

      {loading ? (
        <AdminSkeleton tone="dark" cards={4} rows={4} />
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="border border-yellow-500/30 bg-zinc-900 rounded-2xl p-4"
            >
              <div className="space-y-1 mb-4">
                <p><span className="text-white font-medium">Username:</span> {user.username || "Not set"}</p>
                <p><span className="text-white font-medium">Email:</span> {user.email}</p>
                <p><span className="text-white font-medium">Phone:</span> {user.phone || "Not set"}</p>
                <p><span className="text-white font-medium">Gender:</span> {user.gender || "Not set"}</p>
                <p><span className="text-white font-medium">Role:</span> {user.role}</p>
                <p><span className="text-white font-medium">Status:</span> {user.status}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => updateUser(user.id, { role: "admin" })}
                  className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold"
                >
                  Make Admin
                </button>

                <button
                  onClick={() => updateUser(user.id, { role: "user" })}
                  className="border border-yellow-500 text-yellow-500 px-4 py-2 rounded-lg"
                >
                  Make User
                </button>

                <button
                  onClick={() => updateUser(user.id, { status: "blocked" })}
                  className="border border-red-500 text-red-400 px-4 py-2 rounded-lg"
                >
                  Block
                </button>

                <button
                  onClick={() => updateUser(user.id, { status: "active" })}
                  className="border border-green-500 text-green-400 px-4 py-2 rounded-lg"
                >
                  Activate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
