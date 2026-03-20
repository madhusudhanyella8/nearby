"use client";

import Link from "next/link";
import Image from "next/image";
import type { IBusiness } from "@/types";
import FavoriteButton from "./FavoriteButton";

export default function BusinessCard({ business }: { business: IBusiness }) {
  const stars = "★".repeat(Math.round(business.rating)) + "☆".repeat(5 - Math.round(business.rating));
  const hasPhoto = business.photos && business.photos.length > 0;

  return (
    <Link
      href={`/business/${business._id}`}
      className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden"
    >
      {hasPhoto && (
        <div className="relative w-full h-40">
          <Image
            src={business.photos[0].url}
            alt={business.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {business.photos.length > 1 && (
            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
              +{business.photos.length - 1} more
            </span>
          )}
        </div>
      )}

      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-800 truncate">
              {business.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {business.category?.icon || "🏪"} {business.category?.name}
              </span>
              <span className="text-yellow-500 text-sm">{stars}</span>
              {business.reviewCount > 0 && (
                <span className="text-xs text-gray-400">
                  ({business.reviewCount})
                </span>
              )}
            </div>
          </div>
          <FavoriteButton businessId={business._id} />
        </div>

        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
          {business.description || "No description available"}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {business.area}, {business.city}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {business.phone}
          </span>
        </div>
      </div>
    </Link>
  );
}
