"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Breadcrumbs from "@/components/Breadcrumbs";

interface IPermissionItem {
  _id: string;
  key: string;
  name: string;
}

interface IUserItem {
  _id: string;
  name: string;
  phone: string;
  permissions: IPermissionItem[];
  isActive: boolean;
  createdBy?: { _id: string; name: string };
  createdAt: string;
}

const PERMISSION_LABELS: Record<string, { label: string; color: string }> = {
  admin_panel: { label: "Admin", color: "bg-purple-50 text-purple-700" },
  agent_panel: { label: "Field Agent", color: "bg-blue-50 text-blue-700" },
  business_panel: { label: "Business Owner", color: "bg-green-50 text-green-700" },
};

function getUserBadges(permissions: IPermissionItem[]) {
  if (!permissions || permissions.length === 0) {
    return [{ label: "End User", color: "bg-gray-50 text-gray-700" }];
  }
  return permissions
    .map((p) => PERMISSION_LABELS[p.key])
    .filter(Boolean);
}

type FilterKey = "" | "admin_panel" | "agent_panel" | "business_panel" | "end_user";

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [allUsers, setAllUsers] = useState<IUserItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<IPermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    phone: "",
    permissionKey: "agent_panel",
  });
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [permLoading, setPermLoading] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.permissions?.includes("admin_panel")) {
      fetchUsers();
      fetch("/api/admin/permissions")
        .then((r) => r.json())
        .then((data) => setAllPermissions(data.permissions || []))
        .catch(() => {});
    } else {
      setLoading(false);
    }
  }, [session]);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setAllUsers(data.users || []);
    setLoading(false);
  }

  function hasPermission(user: IUserItem, key: string) {
    return user.permissions?.some((p) => p.key === key);
  }

  function isEndUser(user: IUserItem) {
    return !user.permissions || user.permissions.length === 0 ||
      !user.permissions.some((p) => ["admin_panel", "agent_panel", "business_panel"].includes(p.key));
  }

  const users = (() => {
    if (!filter) return allUsers;
    if (filter === "end_user") return allUsers.filter(isEndUser);
    return allUsers.filter((u) => hasPermission(u, filter));
  })();

  const filterCounts = {
    "": allUsers.length,
    admin_panel: allUsers.filter((u) => hasPermission(u, "admin_panel")).length,
    agent_panel: allUsers.filter((u) => hasPermission(u, "agent_panel")).length,
    business_panel: allUsers.filter((u) => hasPermission(u, "business_panel")).length,
    end_user: allUsers.filter(isEndUser).length,
  };

  async function handleToggleActive(userId: string, currentActive: boolean) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentActive }),
    });
    if (res.ok) {
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isActive: !currentActive } : u
        )
      );
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setAllUsers((prev) => prev.filter((u) => u._id !== userId));
    }
  }

  async function handleTogglePermission(
    userId: string,
    permId: string,
    currentPerms: IPermissionItem[]
  ) {
    setPermLoading(userId);
    const currentIds = currentPerms.map((p) => p._id);
    const newIds = currentIds.includes(permId)
      ? currentIds.filter((id) => id !== permId)
      : [...currentIds, permId];

    const res = await fetch(`/api/admin/users/${userId}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionIds: newIds }),
    });

    if (res.ok) {
      const data = await res.json();
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, permissions: data.permissions } : u
        )
      );
    }
    setPermLoading(null);
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
    setCreateForm({ name: "", phone: "", permissionKey: "agent_panel" });
    fetchUsers();
  }

  if (status === "loading") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!session || !session.user.permissions?.includes("admin_panel")) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl">🔒</span>
        <h1 className="text-xl font-semibold text-gray-700 mt-4">
          Admin Only
        </h1>
      </div>
    );
  }

  const FILTER_TABS: { key: FilterKey; label: string }[] = [
    { key: "", label: "All" },
    { key: "admin_panel", label: "Admin" },
    { key: "agent_panel", label: "Field Agent" },
    { key: "business_panel", label: "Business Owner" },
    { key: "end_user", label: "End User" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Admin Panel", href: "/admin" },
          { label: "User Management" },
        ]}
      />

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
                type="tel"
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, phone: e.target.value }))
                }
                required
                placeholder="10-digit mobile *"
                maxLength={10}
                pattern="[6-9][0-9]{9}"
                title="Enter 10-digit mobile number"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={createForm.permissionKey}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, permissionKey: e.target.value }))
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="agent_panel">Field Agent</option>
                <option value="admin_panel">Admin</option>
              </select>
              <button
                type="submit"
                disabled={createLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {createLoading ? "Creating..." : "Create"}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              The user will login via OTP on their phone number.
            </p>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === tab.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label} ({filterCounts[tab.key]})
          </button>
        ))}
      </div>

      {/* User List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <span className="text-5xl">👥</span>
          <h3 className="text-lg font-medium text-gray-700 mt-4">
            No users found
          </h3>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user._id}
              className={`bg-white rounded-xl border border-gray-100 ${
                !user.isActive ? "opacity-60" : ""
              }`}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-800">{user.name}</h3>
                    {getUserBadges(user.permissions).map((badge, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    ))}
                    {!user.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{user.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setExpandedUser(
                        expandedUser === user._id ? null : user._id
                      )
                    }
                    className="px-3 py-1.5 text-xs rounded-lg border text-gray-600 border-gray-200 hover:bg-gray-50"
                  >
                    {expandedUser === user._id
                      ? "Hide Permissions"
                      : "Permissions"}
                  </button>
                  {user._id !== session.user.id && (
                    <>
                      <button
                        onClick={() =>
                          handleToggleActive(user._id, user.isActive)
                        }
                        className={`px-3 py-1.5 text-xs rounded-lg border ${
                          user.isActive
                            ? "text-red-600 border-red-200 hover:bg-red-50"
                            : "text-green-600 border-green-200 hover:bg-green-50"
                        }`}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="px-3 py-1.5 text-xs rounded-lg border text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Permissions panel */}
              {expandedUser === user._id && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">
                    Toggle permissions for this user:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allPermissions.map((perm) => {
                      const hasPerm = user.permissions?.some(
                        (p) => p._id === perm._id
                      );
                      return (
                        <button
                          key={perm._id}
                          onClick={() =>
                            handleTogglePermission(
                              user._id,
                              perm._id,
                              user.permissions || []
                            )
                          }
                          disabled={permLoading === user._id}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition disabled:opacity-50 ${
                            hasPerm
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {hasPerm ? "✓ " : ""}
                          {perm.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
