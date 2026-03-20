"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { useGeolocation } from "@/hooks/useGeolocation";

interface Suggestion {
  type: "category" | "business";
  text: string;
  slug?: string;
  id?: string;
  city?: string;
  area?: string;
}

export default function SearchBar({ large = false }: { large?: boolean }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const { coords, loading: geoLoading, requestLocation, clearLocation } = useGeolocation();
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    fetch(`/api/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim() && !city.trim()) return;

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city.trim()) params.set("city", city.trim());
    if (coords) {
      params.set("lat", coords.lat.toString());
      params.set("lng", coords.lng.toString());
    }

    router.push(`/search?${params.toString()}`);
    setShowSuggestions(false);
  }

  function handleSuggestionClick(s: Suggestion) {
    if (s.type === "category") {
      router.push(`/search?category=${s.slug}`);
    } else {
      router.push(`/business/${s.id}`);
    }
    setShowSuggestions(false);
  }

  return (
    <div ref={wrapperRef} className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <div
          className={`flex flex-col sm:flex-row bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden ${
            large ? "p-2" : "p-1"
          }`}
        >
          {/* Search input */}
          <div className="flex-1 flex items-center px-4">
            <svg
              className="w-5 h-5 text-gray-400 mr-3 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search for businesses, shops, services..."
              className={`w-full outline-none text-gray-700 placeholder-gray-400 ${
                large ? "py-3 text-lg" : "py-2"
              }`}
            />
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-gray-200 my-2" />

          {/* City input */}
          <div className="flex items-center px-4 border-t sm:border-t-0 border-gray-100">
            <svg
              className="w-5 h-5 text-gray-400 mr-3 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <input
              type="text"
              value={coords ? `GPS (${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)})` : city}
              onChange={(e) => {
                if (coords) clearLocation();
                setCity(e.target.value);
              }}
              placeholder="City or area"
              className={`w-full sm:w-40 outline-none text-gray-700 placeholder-gray-400 ${
                large ? "py-3" : "py-2"
              }`}
              readOnly={!!coords}
            />
            <button
              type="button"
              onClick={coords ? clearLocation : requestLocation}
              className="ml-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 shrink-0"
              title={coords ? "Clear GPS" : "Use my location"}
            >
              {geoLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : coords ? (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Search button */}
          <button
            type="submit"
            className={`bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shrink-0 ${
              large ? "px-8 py-3 text-lg m-1" : "px-6 py-2 m-1"
            }`}
          >
            Search
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
              >
                <span className="text-gray-400 text-sm">
                  {s.type === "category" ? "📂" : "🏪"}
                </span>
                <div>
                  <p className="text-gray-700">{s.text}</p>
                  {s.type === "business" && s.city && (
                    <p className="text-xs text-gray-400">
                      {s.area}, {s.city}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
