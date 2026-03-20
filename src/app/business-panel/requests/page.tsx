"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { IRequest } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-50 text-orange-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export default function BusinessRequestsPage() {
  const { data: session, status: authStatus } = useSession();
  const [requests, setRequests] = useState<IRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.permissions?.includes("business_panel")) {
      fetch("/api/requests")
        .then((r) => r.json())
        .then((data) => setRequests(data.requests || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session]);

  if (authStatus === "loading" || loading) {
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Business Panel", href: "/business-panel" },
          { label: "My Requests" },
        ]}
      />

      <h1 className="text-2xl font-bold text-gray-800 mb-2">My Requests</h1>
      <p className="text-gray-500 mb-6">
        Track the status of your submitted requests
      </p>

      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 mb-6 flex items-center gap-3">
        <span className="text-2xl">📞</span>
        <div>
          <p className="text-sm font-medium text-blue-800">
            Need to register a new business?
          </p>
          <p className="text-sm text-blue-600">
            Call our helpline: <strong>9999900001</strong> or{" "}
            <Link
              href="/register-business"
              className="underline font-semibold hover:text-blue-800"
            >
              submit a request
            </Link>
            .
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <span className="text-5xl">📋</span>
          <h3 className="text-lg font-medium text-gray-700 mt-4">
            No requests yet
          </h3>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_COLORS[req.status]
                    }`}
                  >
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {req.type === "new_business"
                      ? "New Business"
                      : "Role Upgrade"}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>
              </div>

              {req.type === "new_business" && req.businessDetails && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                  <p>
                    <strong>Business:</strong> {req.businessDetails.name}
                  </p>
                  <p>
                    <strong>Address:</strong> {req.businessDetails.address},{" "}
                    {req.businessDetails.area}, {req.businessDetails.city}
                  </p>
                </div>
              )}

              {req.reviewNote && (
                <div
                  className={`mt-3 rounded-lg p-3 text-sm ${
                    req.status === "approved"
                      ? "bg-green-50 border border-green-100"
                      : req.status === "rejected"
                      ? "bg-red-50 border border-red-100"
                      : "bg-gray-50 border border-gray-100"
                  }`}
                >
                  <p
                    className={`font-medium ${
                      req.status === "approved"
                        ? "text-green-800"
                        : req.status === "rejected"
                        ? "text-red-800"
                        : "text-gray-800"
                    }`}
                  >
                    Reviewer Comment:
                  </p>
                  <p
                    className={`mt-1 ${
                      req.status === "approved"
                        ? "text-green-700"
                        : req.status === "rejected"
                        ? "text-red-700"
                        : "text-gray-600"
                    }`}
                  >
                    {req.reviewNote}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
