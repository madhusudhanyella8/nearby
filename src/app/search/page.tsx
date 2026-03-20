"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import BusinessCard from "@/components/BusinessCard";
import FilterSidebar from "@/components/FilterSidebar";
import type { IBusiness } from "@/types";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<IBusiness[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const city = searchParams.get("city") || "";
  const area = searchParams.get("area") || "";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      let url: string;

      if (lat && lng) {
        const params = new URLSearchParams({
          lat,
          lng,
          ...(category && { category }),
        });
        url = `/api/businesses/nearby?${params}`;
      } else {
        const params = new URLSearchParams({
          ...(q && { q }),
          ...(category && { category }),
          ...(city && { city }),
          ...(area && { area }),
          page: page.toString(),
          limit: "20",
        });
        url = `/api/businesses?${params}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      setBusinesses(data.businesses || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setBusinesses([]);
    }
    setLoading(false);
  }, [q, category, city, area, lat, lng, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  function handleFilterChange(filters: { category?: string; city?: string; area?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    if (filters.category !== undefined) {
      filters.category ? params.set("category", filters.category) : params.delete("category");
    }
    if (filters.city !== undefined) {
      filters.city ? params.set("city", filters.city) : params.delete("city");
    }
    if (filters.area !== undefined) {
      filters.area ? params.set("area", filters.area) : params.delete("area");
    }

    params.delete("lat");
    params.delete("lng");
    setPage(1);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search bar at top */}
      <div className="mb-8">
        <SearchBar />
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          {loading
            ? "Searching..."
            : `${total} result${total !== 1 ? "s" : ""} found`}
          {q && <span className="text-gray-500"> for &ldquo;{q}&rdquo;</span>}
          {lat && lng && (
            <span className="text-sm text-blue-600 ml-2">(near you)</span>
          )}
        </h1>
        <button
          className="sm:hidden text-sm text-blue-600 font-medium"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Hide Filters" : "Filters"}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Filter sidebar */}
        <aside
          className={`${
            showFilters ? "block" : "hidden"
          } sm:block w-full sm:w-64 shrink-0`}
        >
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              Filters
            </h2>
            <FilterSidebar
              selectedCategory={category}
              selectedCity={city}
              selectedArea={area}
              onFilterChange={handleFilterChange}
            />
          </div>
        </aside>

        {/* Results list */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse"
                >
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-1/4 mb-4" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl">🔍</span>
              <h3 className="text-lg font-medium text-gray-700 mt-4">
                No businesses found
              </h3>
              <p className="text-gray-400 mt-2">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {businesses.map((biz) => (
                  <BusinessCard key={biz._id} business={biz} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-400">
          Loading...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
