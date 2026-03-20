"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  admins: number;
  agents: number;
  businessOwners: number;
  endUsers: number;
  totalBusinesses: number;
  activeBusinesses: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      Promise.all([
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/admin/businesses").then((r) => r.json()),
      ])
        .then(([userData, bizData]) => {
          const users = userData.users || [];
          const businesses = bizData.businesses || [];
          setStats({
            totalUsers: users.length,
            admins: users.filter((u: { role: string }) => u.role === "admin").length,
            agents: users.filter((u: { role: string }) => u.role === "agent").length,
            businessOwners: users.filter((u: { role: string }) => u.role === "business_owner").length,
            endUsers: users.filter((u: { role: string }) => u.role === "user").length,
            totalBusinesses: businesses.length,
            activeBusinesses: businesses.filter((b: { isActive: boolean }) => b.isActive).length,
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl">🔒</span>
        <h1 className="text-xl font-semibold text-gray-700 mt-4">
          Admin Only
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Admin Dashboard
      </h1>
      <p className="text-gray-500 mb-8">Manage VIPANI platform</p>

      {stats && (
        <>
          {/* User Stats */}
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Users</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Agents</p>
              <p className="text-2xl font-bold text-blue-600">{stats.agents}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Biz Owners</p>
              <p className="text-2xl font-bold text-green-600">{stats.businessOwners}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500">End Users</p>
              <p className="text-2xl font-bold text-gray-600">{stats.endUsers}</p>
            </div>
          </div>

          {/* Business Stats */}
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Businesses
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.totalBusinesses}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.activeBusinesses}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Quick Links */}
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Management</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition"
        >
          <h3 className="font-semibold text-gray-800">User Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            Create admin/agent accounts, deactivate users
          </p>
        </Link>
        <Link
          href="/admin/businesses"
          className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition"
        >
          <h3 className="font-semibold text-gray-800">All Businesses</h3>
          <p className="text-sm text-gray-500 mt-1">
            View, activate or deactivate registered businesses
          </p>
        </Link>
        <Link
          href="/requests"
          className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition"
        >
          <h3 className="font-semibold text-gray-800">Requests</h3>
          <p className="text-sm text-gray-500 mt-1">
            Review business registration and upgrade requests
          </p>
        </Link>
      </div>
    </div>
  );
}
