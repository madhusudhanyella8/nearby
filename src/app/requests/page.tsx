"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { IRequest } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-50 text-orange-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export default function RequestsPage() {
  const { data: session, status: authStatus } = useSession();
  const [requests, setRequests] = useState<IRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isReviewer = session?.user?.permissions?.includes("agent_panel");

  useEffect(() => {
    if (session) {
      fetch("/api/requests")
        .then((r) => r.json())
        .then((data) => setRequests(data.requests || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session]);

  async function handleAction(requestId: string, status: "approved" | "rejected") {
    const note = reviewNotes[requestId]?.trim() || "";
    if (!note) {
      setErrors((prev) => ({ ...prev, [requestId]: "Comment is required" }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    });
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: note }),
      });

      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === requestId
              ? { ...r, status, reviewNote: note, reviewedBy: { _id: session!.user.id, name: session!.user.name || "" } }
              : r
          )
        );
        setReviewNotes((prev) => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
      }
    } catch {
      // silently fail
    }
    setActionLoading(null);
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl">🔒</span>
        <h1 className="text-xl font-semibold text-gray-700 mt-4">
          Please login to view requests
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={
          session.user.permissions?.includes("agent_panel")
            ? [
                { label: "Home", href: "/" },
                { label: "Agent Panel", href: "/agent" },
                { label: "Requests" },
              ]
            : session.user.permissions?.includes("admin_panel")
            ? [
                { label: "Home", href: "/" },
                { label: "Admin Panel", href: "/admin" },
                { label: "Requests" },
              ]
            : [
                { label: "Home", href: "/" },
                { label: "Business Panel", href: "/business-panel" },
                { label: "My Requests" },
              ]
        }
      />
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        {isReviewer ? "Manage Requests" : "My Requests"}
      </h1>
      <p className="text-gray-500 mb-8">
        {isReviewer
          ? "Review and act on business registration and upgrade requests"
          : "Track the status of your submitted requests"}
      </p>

      {/* Helpline info for business owners */}
      {session.user.permissions?.includes("business_panel") && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">📞</span>
          <div>
            <p className="text-sm font-medium text-blue-800">
              Need to register a new business?
            </p>
            <p className="text-sm text-blue-600">
              Call our helpline: <strong>9999900001</strong> or submit a
              request below.
            </p>
          </div>
        </div>
      )}

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
                <div>
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
                  {isReviewer && (
                    <p className="text-sm text-gray-500 mt-1">
                      From: {req.requestedBy?.name} ({req.requestedBy?.phone})
                    </p>
                  )}
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
                    <strong>Phone:</strong> {req.businessDetails.phone}
                  </p>
                  <p>
                    <strong>Address:</strong> {req.businessDetails.address},{" "}
                    {req.businessDetails.area}, {req.businessDetails.city}
                  </p>
                  {req.businessDetails.description && (
                    <p className="text-gray-500">
                      {req.businessDetails.description}
                    </p>
                  )}
                </div>
              )}

              {req.type === "role_upgrade" && req.upgradeReason && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <strong>Reason:</strong> {req.upgradeReason}
                </p>
              )}

              {req.reviewNote && (
                <div className={`mt-3 rounded-lg p-3 text-sm ${
                  req.status === "approved"
                    ? "bg-green-50 border border-green-100"
                    : req.status === "rejected"
                    ? "bg-red-50 border border-red-100"
                    : "bg-gray-50 border border-gray-100"
                }`}>
                  <p className={`font-medium ${
                    req.status === "approved" ? "text-green-800" : req.status === "rejected" ? "text-red-800" : "text-gray-800"
                  }`}>
                    Reviewer Comment {req.reviewedBy?.name ? `(${req.reviewedBy.name})` : ""}:
                  </p>
                  <p className={`mt-1 ${
                    req.status === "approved" ? "text-green-700" : req.status === "rejected" ? "text-red-700" : "text-gray-600"
                  }`}>
                    {req.reviewNote}
                  </p>
                </div>
              )}

              {/* Action buttons for reviewers */}
              {isReviewer && req.status === "pending" && (
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                  <div>
                    <textarea
                      value={reviewNotes[req._id] || ""}
                      onChange={(e) => {
                        setReviewNotes((prev) => ({ ...prev, [req._id]: e.target.value }));
                        if (errors[req._id]) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next[req._id];
                            return next;
                          });
                        }
                      }}
                      placeholder="Add a comment (required)"
                      rows={2}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[req._id] ? "border-red-400" : "border-gray-200"
                      }`}
                    />
                    {errors[req._id] && (
                      <p className="text-xs text-red-500 mt-1">{errors[req._id]}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req._id, "approved")}
                      disabled={actionLoading === req._id}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(req._id, "rejected")}
                      disabled={actionLoading === req._id}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
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
