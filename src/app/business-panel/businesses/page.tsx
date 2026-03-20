"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { IBusiness } from "@/types";

export default function MyBusinessesPage() {
  const { data: session, status } = useSession();
  const [businesses, setBusinesses] = useState<IBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.permissions?.includes("business_panel")) {
      fetch("/api/businesses?owner=me")
        .then((r) => r.json())
        .then((data) => setBusinesses(data.businesses || []))
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

  if (!session || !session.user.permissions?.includes("business_panel")) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl">🔒</span>
        <h1 className="text-xl font-semibold text-gray-700 mt-4">
          Business Owners Only
        </h1>
      </div>
    );
  }

  async function handleDeactivate(id: string) {
    try {
      const res = await fetch(`/api/businesses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBusinesses((prev) =>
          prev.map((b) => (b._id === id ? { ...b, isActive: false } : b))
        );
      }
    } catch {
      // silently fail
    }
    setConfirmDeactivate(null);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Business Panel", href: "/business-panel" },
          { label: "My Businesses" },
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Businesses</h1>
          <p className="text-gray-500">Manage your business listings</p>
        </div>
        <Link
          href="/register-business"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Request New Business
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <span className="text-5xl">🏪</span>
          <h3 className="text-lg font-medium text-gray-700 mt-4">
            No businesses yet
          </h3>
          <p className="text-gray-400 mt-2">
            Your businesses will appear here once registered by our field agent.
          </p>
          <Link
            href="/register-business"
            className="inline-block mt-4 text-blue-600 hover:underline font-medium"
          >
            Request a New Business
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {businesses.map((biz) => (
            <div
              key={biz._id}
              className={`bg-white rounded-xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4${!biz.isActive ? " opacity-60" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {biz.name}
                  </h3>
                  {!biz.isActive && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {biz.category?.icon} {biz.category?.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {biz.area}, {biz.city}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{biz.phone}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/business/${biz._id}`}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border text-gray-600 border-gray-200 hover:bg-gray-50 transition"
                >
                  View
                </Link>
                <Link
                  href={`/business-panel/businesses/edit/${biz._id}`}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border text-blue-600 border-blue-200 hover:bg-blue-50 transition"
                >
                  Edit
                </Link>
                {confirmDeactivate === biz._id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Sure?</span>
                    <button
                      onClick={() => handleDeactivate(biz._id)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeactivate(null)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border text-gray-600 border-gray-200 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeactivate(biz._id)}
                    disabled={!biz.isActive}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border text-red-600 border-red-200 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {biz.isActive ? "Deactivate" : "Inactive"}
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
