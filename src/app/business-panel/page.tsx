"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function BusinessPanel() {
  const { data: session, status } = useSession();

  if (status === "loading") {
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
        items={[{ label: "Home", href: "/" }, { label: "Business Panel" }]}
      />

      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Business Panel
      </h1>
      <p className="text-gray-500 mb-8">
        Manage your businesses and requests
      </p>

      <div className="grid sm:grid-cols-2 gap-6">
        <Link
          href="/business-panel/businesses"
          className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-md transition group"
        >
          <div className="text-4xl mb-4">🏪</div>
          <h2 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600">
            My Businesses
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            View and edit your business listings
          </p>
        </Link>

        <Link
          href="/business-panel/requests"
          className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-md transition group"
        >
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600">
            My Requests
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your business registration requests
          </p>
        </Link>
      </div>
    </div>
  );
}
