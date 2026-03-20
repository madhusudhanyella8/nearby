"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { ICategory } from "@/types";

export default function AgentRegisterPage() {
  const { data: session, status } = useSession();
  const { coords, loading: geoLoading, requestLocation } = useGeolocation();

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [form, setForm] = useState({
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    oneTimePassword: "",
    businessName: "",
    businessDescription: "",
    businessCategory: "",
    businessPhone: "",
    businessAddress: "",
    businessCity: "",
    businessArea: "",
    latitude: "",
    longitude: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
    email: string;
    password: string;
    businessName: string;
  } | null>(null);
  const [useGPS, setUseGPS] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (coords) {
      setForm((f) => ({
        ...f,
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
      }));
    }
  }, [coords]);

  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!session || session.user.role !== "agent") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl">🔒</span>
        <h1 className="text-xl font-semibold text-gray-700 mt-4">
          Field Agents Only
        </h1>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess({
        email: data.owner.email,
        password: data.temporaryPassword,
        businessName: data.business.name,
      });
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-green-50 rounded-2xl border border-green-200 p-8 text-center">
          <span className="text-5xl">✅</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">
            Registration Successful!
          </h1>
          <p className="text-gray-600 mt-2">
            Business &ldquo;{success.businessName}&rdquo; has been registered.
          </p>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6 text-left">
            <h2 className="font-semibold text-gray-700 mb-3">
              Credentials to share with business owner:
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
                <span className="text-sm text-gray-500">Email</span>
                <span className="font-mono font-medium text-gray-800">
                  {success.email}
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
                <span className="text-sm text-gray-500">
                  One-Time Password
                </span>
                <span className="font-mono font-medium text-gray-800">
                  {success.password}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              The business owner will be asked to change this password on their
              first login.
            </p>
          </div>

          <button
            onClick={() => {
              setSuccess(null);
              setForm({
                ownerName: "",
                ownerEmail: "",
                ownerPhone: "",
                oneTimePassword: "",
                businessName: "",
                businessDescription: "",
                businessCategory: "",
                businessPhone: "",
                businessAddress: "",
                businessCity: "",
                businessArea: "",
                latitude: "",
                longitude: "",
              });
            }}
            className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Register Another Business
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Register New Business
      </h1>
      <p className="text-gray-500 mb-8">
        Create a business listing and owner account in one step
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Owner Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">
            Business Owner Account
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner Name *
            </label>
            <input
              type="text"
              value={form.ownerName}
              onChange={(e) => updateForm("ownerName", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full name of the business owner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Email *
              </label>
              <input
                type="email"
                value={form.ownerEmail}
                onChange={(e) => updateForm("ownerEmail", e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="owner@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Phone
              </label>
              <input
                type="tel"
                value={form.ownerPhone}
                onChange={(e) => updateForm("ownerPhone", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              One-Time Password (leave blank to auto-generate)
            </label>
            <input
              type="text"
              value={form.oneTimePassword}
              onChange={(e) => updateForm("oneTimePassword", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Auto-generated if empty"
            />
          </div>
        </div>

        {/* Business Details Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Business Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => updateForm("businessName", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Sri Krishna Gold Palace"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={form.businessCategory}
              onChange={(e) => updateForm("businessCategory", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
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
              value={form.businessDescription}
              onChange={(e) =>
                updateForm("businessDescription", e.target.value)
              }
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell customers about this business..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Phone *
            </label>
            <input
              type="tel"
              value={form.businessPhone}
              onChange={(e) => updateForm("businessPhone", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Location</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <input
              type="text"
              value={form.businessAddress}
              onChange={(e) => updateForm("businessAddress", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123, MG Road"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={form.businessCity}
                onChange={(e) => updateForm("businessCity", e.target.value)}
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
                value={form.businessArea}
                onChange={(e) => updateForm("businessArea", e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Koramangala"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={useGPS}
                  onChange={() => {
                    setUseGPS(true);
                    requestLocation();
                  }}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">Use GPS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!useGPS}
                  onChange={() => setUseGPS(false)}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">Enter manually</span>
              </label>
            </div>

            {useGPS ? (
              <p className="text-sm text-gray-500">
                {geoLoading
                  ? "Getting location..."
                  : coords
                  ? `Location: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                  : "Click to detect location"}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => updateForm("latitude", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12.9716"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => updateForm("longitude", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="77.5946"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register Business & Create Account"}
        </button>
      </form>
    </div>
  );
}
