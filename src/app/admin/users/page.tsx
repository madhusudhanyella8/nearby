"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { IUserItem } from "@/types";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  agent: "Field Agent",
  business_owner: "Business Owner",
  user: "End User",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700",
  agent: "bg-blue-50 text-blue-700",
  business_owner: "bg-green-50 text-green-700",
  user: "bg-gray-50 text-gray-700",
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<IUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "agent",
  });
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [session, roleFilter]);

  async function fetchUsers() {
    setLoading(true);
    const params = roleFilter ? `?role=${roleFilter}` : "";
    const res = await fetch(`/api/admin/users${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function handleToggleActive(userId: string, currentActive: boolean) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentActive }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isActive: !currentActive } : u
        )
      );
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });

    const data = await res.json();
    setCreateLoading(false);

    if (!res.ok) {
      setCreateError(data.error);
      return;
    }

    setShowCreateForm(false);
    setCreateForm({ name: "", email: "", phone: "", password: "", role: "agent" });
    fetchUsers();
  }

  if (status === "loading") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl">🔒</span>
        <h1 className="text-xl font-semibold text-gray-700 mt-4">
          Admin Only
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          {showCreateForm ? "Cancel" : "+ Create Admin/Agent"}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">
            Create New Account
          </h2>
          {createError && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
              {createError}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                placeholder="Full name"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, email: e.target.value }))
                }
                required
                placeholder="Email"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="Phone (optional)"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, password: e.target.value }))
                }
                required
                placeholder="Password"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, role: e.target.value }))
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="agent">Field Agent</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={createLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {createLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Role Filter */}
      <div className="flex gap-2 mb-6">
        {["", "admin", "agent", "business_owner", "user"].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              roleFilter === r
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {r ? ROLE_LABELS[r] : "All"}
          </button>
        ))}
      </div>

      {/* User List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading users...</div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user._id}
              className={`bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between ${
                !user.isActive ? "opacity-60" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-800">{user.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ROLE_COLORS[user.role] || "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                  {!user.isActive && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.phone && (
                  <p className="text-xs text-gray-400">{user.phone}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {user._id !== session.user.id && (
                  <button
                    onClick={() => handleToggleActive(user._id, user.isActive)}
                    className={`px-3 py-1.5 text-xs rounded-lg border ${
                      user.isActive
                        ? "text-red-600 border-red-200 hover:bg-red-50"
                        : "text-green-600 border-green-200 hover:bg-green-50"
                    }`}
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
