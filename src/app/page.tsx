"use client";

import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import type { ICategory } from "@/types";

export default function Home() {
  const [categories, setCategories] = useState<ICategory[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              Find the Best Businesses
              <br />
              <span className="text-blue-200">Near You</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
              Discover local shops, restaurants, and services in your
              neighborhood. Search by name, category, or location.
            </p>
          </div>
          <SearchBar large />
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
          Browse by Category
        </h2>
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <CategoryCard
                key={cat._id}
                name={cat.name}
                slug={cat.slug}
                icon={cat.icon}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">
            No categories yet. Be the first to register a business!
          </p>
        )}
      </section>

      {/* How it works */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-12">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Search</h3>
              <p className="text-sm text-gray-500">
                Type what you&apos;re looking for — a gold shop, restaurant, or
                any service near you.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Discover</h3>
              <p className="text-sm text-gray-500">
                Browse results filtered by your location, category, or area to
                find the best match.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📞</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Connect</h3>
              <p className="text-sm text-gray-500">
                Get contact details, directions, and connect with businesses
                directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm space-y-2">
          <p className="text-white font-semibold text-base">🛍️ VIPANI</p>
          <p>Your Trusted Local Business Directory</p>
          <p className="text-gray-500">&copy; {new Date().getFullYear()} VIPANI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
