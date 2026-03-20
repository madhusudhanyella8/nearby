"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { ICategory } from "@/types";
import PhotoUploader from "@/components/PhotoUploader";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function AgentRegisterPage() {
  const { data: session, status } = useSession();
  const { coords, loading: geoLoading, requestLocation } = useGeolocation();

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [form, setForm] = useState({
    ownerName: "",
    ownerPhone: "",
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
    phone: string;
    businessName: string;
    businessId: string;
  } | null>(null);
  const [photos, setPhotos] = useState<{ url: string; publicId: string }[]>([]);
  const [pendingImages, setPendingImages] = useState<{ dataUri: string; mimeType: string; preview: string }[]>([]);
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

  if (!session || !session.user.permissions?.includes("agent_panel")) {
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

      // Upload pending images to the newly created business
      if (pendingImages.length > 0) {
        try {
          const uploadRes = await fetch(`/api/businesses/${data.business._id}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              images: pendingImages.map((img) => ({
                dataUri: img.dataUri,
                mimeType: img.mimeType,
              })),
            }),
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            setPhotos(uploadData.photos || []);
          }
        } catch {
          // Photos can still be added from the success screen
        }
        setPendingImages([]);
      }

      setSuccess({
        phone: data.owner.phone,
        businessName: data.business.name,
        businessId: data.business._id,
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
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Agent Panel", href: "/agent" },
            { label: "Registration Complete" },
          ]}
        />
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
              Owner Account Created
            </h2>
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-500">Phone</span>
              <span className="font-mono font-medium text-gray-800 ml-4">
                {success.phone}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              The business owner can login using OTP on this phone number.
            </p>
          </div>

          {photos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6 text-left">
              <h2 className="font-semibold text-gray-700 mb-3">
                Uploaded Photos ({photos.length})
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {photos.map((photo) => (
                  <div key={photo.publicId} className="aspect-square relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt="Business photo"
                      className="object-cover rounded-lg w-full h-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setSuccess(null);
              setPhotos([]);
              setPendingImages([]);
              setForm({
                ownerName: "",
                ownerPhone: "",
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
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Agent Panel", href: "/agent" },
          { label: "Register Business" },
        ]}
      />

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner Phone *
            </label>
            <input
              type="tel"
              value={form.ownerPhone}
              onChange={(e) => updateForm("ownerPhone", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="9876543210"
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              title="Enter 10-digit mobile number"
            />
            <p className="text-xs text-gray-400 mt-1">
              Owner will login via OTP on this number
            </p>
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
              placeholder="9876543210"
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              title="Enter 10-digit mobile number"
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

        {/* Photos Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 mb-3">
            Business Photos (Optional)
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Add up to 5 photos. They will be uploaded after the business is created.
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
            {pendingImages.map((img, idx) => (
              <div key={idx} className="relative group aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
                  alt={`Photo ${idx + 1}`}
                  className="object-cover rounded-lg w-full h-full"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPendingImages((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                >
                  X
                </button>
              </div>
            ))}

            {pendingImages.length < 5 && (
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition cursor-pointer">
                <span className="text-2xl">+</span>
                <span className="text-xs">Add Photo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (!e.target.files) return;
                    const remaining = 5 - pendingImages.length;
                    const files = Array.from(e.target.files).slice(0, remaining);
                    files.forEach((file) => {
                      if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUri = reader.result as string;
                        setPendingImages((prev) => [
                          ...prev,
                          { dataUri, mimeType: file.type, preview: dataUri },
                        ]);
                      };
                      reader.readAsDataURL(file);
                    });
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Max 5 photos. JPEG, PNG, or WebP. Up to 3MB each.
          </p>
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
