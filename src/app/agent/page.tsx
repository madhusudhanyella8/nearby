"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { IRequest } from "@/types";

export default function AgentPanel() {
  const { data: session, status } = useSession();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.permissions?.includes("agent_panel")) {
      fetch("/api/requests?status=pending")
        .then((r) => r.json())
        .then((data) => {
          const requests: IRequest[] = data.requests || [];
          setPendingCount(requests.length);
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

  if (!session || !session.user.permissions?.includes("agent_panel")) {
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
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Agent Panel" }]}
      />

      <h1 className="text-2xl font-bold text-gray-800 mb-2">Agent Panel</h1>
      <p className="text-gray-500 mb-8">Welcome, {session.user.name}</p>

      <div className="grid sm:grid-cols-2 gap-6">
        <Link
          href="/requests"
          className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-md transition group"
        >
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600">
            Requests
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review business registration and upgrade requests
          </p>
          {pendingCount > 0 && (
            <span className="inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
              {pendingCount} pending
            </span>
          )}
        </Link>

        <Link
          href="/agent/register"
          className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-md transition group"
        >
          <div className="text-4xl mb-4">🏪</div>
          <h2 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600">
            Register Business
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Register a new business and create owner account
          </p>
        </Link>
      </div>
    </div>
  );
}
