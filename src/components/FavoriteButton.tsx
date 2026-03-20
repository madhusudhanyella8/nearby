"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function FavoriteButton({
  businessId,
}: {
  businessId: string;
}) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = !!session;

  useEffect(() => {
    if (!isLoggedIn) return;

    fetch("/api/favorites")
      .then((r) => r.json())
      .then((data) => {
        const favs = data.favorites || [];
        setIsFavorite(
          favs.some(
            (f: { business: { _id: string } | null }) =>
              f.business?._id === businessId
          )
        );
      })
      .catch(() => {});
  }, [businessId, isLoggedIn]);

  if (!isLoggedIn) return null;

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      if (isFavorite) {
        await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId }),
        });
        setIsFavorite(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId }),
        });
        setIsFavorite(true);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`p-1.5 rounded-full transition ${
        isFavorite
          ? "text-red-500 hover:text-red-600"
          : "text-gray-300 hover:text-red-400"
      }`}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        className="w-5 h-5"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
