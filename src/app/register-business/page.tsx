"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { ICategory } from "@/types";

export default function RequestBusinessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    phone: "",
    address: "",
    city: "",
    area: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!session || !session.user.permissions?.includes("business_panel")) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl">🔒</span>
        <h1 className="text-xl font-semibold text-gray-700 mt-4">
          Business Owners Only
        </h1>
        <p className="text-gray-400 mt-2">
          Only registered business owners can request new business listings.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new_business",
          businessDetails: form,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  }

  function updateForm(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-green-50 rounded-2xl border border-green-200 p-8">
          <span className="text-5xl">✅</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">
            Request Submitted!
          </h1>
          <p className="text-gray-600 mt-2">
            Our field agent will review your request and visit the business
            location to complete the registration.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => router.push("/requests")}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700"
            >
              View My Requests
            </button>
            <button
              onClick={() => router.push("/business-panel")}
              className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50"
            >
              Go to Business Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Business Panel", href: "/business-panel" },
          { label: "Request New Business" },
        ]}
      />
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Request New Business Registration
      </h1>
      <p className="text-gray-500 mb-4">
        Submit details below and our field agent will visit to complete the
        registration.
      </p>

      {/* Helpline */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 mb-6 flex items-center gap-3">
        <span className="text-2xl">📞</span>
        <div>
          <p className="text-sm text-blue-600">
            Or call directly: <strong>9999900001</strong>
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Sri Krishna Gold Palace"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => updateForm("category", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about this business..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateForm("phone", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="9876543210"
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              title="Enter 10-digit mobile number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateForm("address", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateForm("city", e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Bangalore"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area *
              </label>
              <input
                type="text"
                value={form.area}
                onChange={(e) => updateForm("area", e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Koramangala"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
