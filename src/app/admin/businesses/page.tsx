"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { IBusiness } from "@/types";

export default function AdminBusinessesPage() {
  const { data: session, status: authStatus } = useSession();
  const [businesses, setBusinesses] = useState<IBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetch("/api/admin/businesses")
        .then((r) => r.json())
        .then((data) => setBusinesses(data.businesses || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session]);

  async function toggleActive(bizId: string, isActive: boolean) {
    setToggling(bizId);
    try {
      const res = await fetch("/api/admin/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: bizId, isActive }),
      });
      if (res.ok) {
        setBusinesses((prev) =>
          prev.map((b) => (b._id === bizId ? { ...b, isActive } : b))
        );
      }
    } catch {
      // silently fail
    }
    setToggling(null);
  }

  if (authStatus === "loading" || loading) {
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

  const filtered = businesses.filter((b) => {
    if (filter === "active") return b.isActive;
    if (filter === "inactive") return !b.isActive;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-800">All Businesses</h1>
        <Link
          href="/admin"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Admin
        </Link>
      </div>
      <p className="text-gray-500 mb-6">
        {businesses.length} total businesses registered on VIPANI
      </p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "all" && ` (${businesses.length})`}
            {f === "active" && ` (${businesses.filter((b) => b.isActive).length})`}
            {f === "inactive" && ` (${businesses.filter((b) => !b.isActive).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <span className="text-5xl">🏢</span>
          <h3 className="text-lg font-medium text-gray-700 mt-4">
            No businesses found
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((biz) => (
            <div
              key={biz._id}
              className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {biz.category?.icon || "🏪"}
                  </span>
                  <h3 className="font-semibold text-gray-800 truncate">
                    {biz.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      biz.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {biz.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {biz.category?.name} · {biz.area}, {biz.city}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Owner: {biz.owner?.name || "N/A"} ({biz.owner?.phone || "N/A"}) · Biz Phone: {biz.phone}
                </p>
              </div>
              <button
                onClick={() => toggleActive(biz._id, !biz.isActive)}
                disabled={toggling === biz._id}
                className={`ml-4 px-3 py-1.5 text-xs font-medium rounded-lg transition disabled:opacity-50 ${
                  biz.isActive
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
              >
                {biz.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
