"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useGeolocation } from "@/hooks/useGeolocation";
import PhotoUploader from "@/components/PhotoUploader";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { IBusiness, ICategory } from "@/types";

export default function EditBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const { coords, loading: geoLoading, requestLocation } = useGeolocation();

  const [business, setBusiness] = useState<IBusiness | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [useGPS, setUseGPS] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    phone: "",
    address: "",
    city: "",
    area: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/businesses/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((biz: IBusiness) => {
        setBusiness(biz);
        setForm({
          name: biz.name,
          description: biz.description || "",
          category: biz.category?._id || "",
          phone: biz.phone,
          address: biz.address,
          city: biz.city || "",
          area: biz.area || "",
          latitude: biz.location?.coordinates?.[1]?.toString() || "",
          longitude: biz.location?.coordinates?.[0]?.toString() || "",
        });
      })
      .catch(() => setError("Business not found"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (coords) {
      setForm((f) => ({
        ...f,
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
      }));
    }
  }, [coords]);

  function updateForm(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch(`/api/businesses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      setSuccess("Business updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setSaving(false);
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl">🔒</span>
        <h1 className="text-xl font-semibold text-gray-700 mt-4">
          Please login
        </h1>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl">😕</span>
        <h1 className="text-xl font-semibold text-gray-700 mt-4">
          Business not found
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Business Panel", href: "/business-panel" },
          { label: "My Businesses", href: "/business-panel/businesses" },
          { label: "Edit" },
        ]}
      />

      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Edit Business
      </h1>
      <p className="text-gray-500 mb-6">Update details for {business.name}</p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Details */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Business Details</h2>

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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={form.category}
              onChange={(e) => updateForm("category", e.target.value)}
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
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
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
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Location</h2>

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

        {/* Photos */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <PhotoUploader
            businessId={id}
            photos={business.photos || []}
            onUpdate={(photos) =>
              setBusiness((b) => (b ? { ...b, photos } : b))
            }
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
