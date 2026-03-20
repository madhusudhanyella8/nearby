"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { IRequest } from "@/types";

export default function AgentDashboard() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<IRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === "agent") {
      fetch("/api/requests?status=pending")
        .then((r) => r.json())
        .then((data) => setRequests(data.requests || []))
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

  if (!session || session.user.role !== "agent") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl">🔒</span>
        <h1 className="text-xl font-semibold text-gray-700 mt-4">
          Field Agents Only
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agent Dashboard</h1>
          <p className="text-gray-500">
            Welcome, {session.user.name}
          </p>
        </div>
        <Link
          href="/agent/register"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          + Register Business
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Pending Requests</p>
          <p className="text-3xl font-bold text-orange-600">{requests.length}</p>
        </div>
        <Link
          href="/requests"
          className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition"
        >
          <p className="text-sm text-gray-500">View All Requests</p>
          <p className="text-sm text-blue-600 font-medium mt-2">
            Manage requests &rarr;
          </p>
        </Link>
      </div>

      {/* Recent pending requests */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Recent Pending Requests
      </h2>
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <span className="text-4xl">✅</span>
          <p className="text-gray-500 mt-3">No pending requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.slice(0, 5).map((req) => (
            <Link
              key={req._id}
              href="/requests"
              className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 mr-2">
                    {req.type === "new_business"
                      ? "New Business"
                      : "Role Upgrade"}
                  </span>
                  <span className="text-sm text-gray-700">
                    {req.type === "new_business"
                      ? req.businessDetails?.name
                      : `${req.requestedBy.name} wants to upgrade`}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
