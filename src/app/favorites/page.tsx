"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import BusinessCard from "@/components/BusinessCard";
import type { IBusiness } from "@/types";

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState<IBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === "user") {
      fetch("/api/favorites")
        .then((r) => r.json())
        .then((data) => {
          const favs = data.favorites || [];
          setFavorites(favs.map((f: { business: IBusiness }) => f.business).filter(Boolean));
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

  if (!session || session.user.role !== "user") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <span className="text-5xl">🔒</span>
        <h1 className="text-xl font-semibold text-gray-700 mt-4">
          End Users Only
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">My Favorites</h1>
      <p className="text-gray-500 mb-8">Businesses you&apos;ve saved</p>

      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <span className="text-5xl">❤️</span>
          <h3 className="text-lg font-medium text-gray-700 mt-4">
            No favorites yet
          </h3>
          <p className="text-gray-400 mt-2">
            Search for businesses and click the heart icon to save them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((biz) => (
            <BusinessCard key={biz._id} business={biz} />
          ))}
        </div>
      )}
    </div>
  );
}
