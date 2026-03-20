"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import type { IBusiness } from "@/types";

export default function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [business, setBusiness] = useState<IBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/businesses/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setBusiness)
      .catch(() => setError("Business not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/4 mb-6" />
          <div className="h-20 bg-gray-100 rounded mb-6" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl">😕</span>
        <h1 className="text-xl font-semibold text-gray-700 mt-4">
          {error || "Business not found"}
        </h1>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          Go back home
        </Link>
      </div>
    );
  }

  const stars =
    "★".repeat(Math.round(business.rating)) +
    "☆".repeat(5 - Math.round(business.rating));

  const mapsUrl = business.location?.coordinates
    ? `https://www.google.com/maps?q=${business.location.coordinates[1]},${business.location.coordinates[0]}`
    : `https://www.google.com/maps?q=${encodeURIComponent(business.address + ", " + business.city)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/search"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        &larr; Back to search
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{business.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/20">
                  {business.category?.icon} {business.category?.name}
                </span>
                <span className="text-yellow-300">{stars}</span>
                {business.reviewCount > 0 && (
                  <span className="text-blue-200 text-sm">
                    ({business.reviewCount} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        {business.photos && business.photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
            {business.photos.map((photo, idx) => (
              <div key={photo.publicId} className="relative aspect-square">
                <Image
                  src={photo.url}
                  alt={`${business.name} photo ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="p-8">
          {business.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                About
              </h2>
              <p className="text-gray-700">{business.description}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Address
              </h2>
              <p className="text-gray-700">{business.address}</p>
              <p className="text-gray-500">
                {business.area}, {business.city}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Contact
              </h2>
              <a
                href={`tel:${business.phone}`}
                className="text-blue-600 font-medium text-lg"
              >
                {business.phone}
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-100">
            <a
              href={`tel:${business.phone}`}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Now
            </a>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
