"use client";

import { useEffect, useState } from "react";
import type { ICategory } from "@/types";

interface Props {
  selectedCategory: string;
  selectedCity: string;
  selectedArea: string;
  onFilterChange: (filters: { category?: string; city?: string; area?: string }) => void;
}

export default function FilterSidebar({
  selectedCategory,
  selectedCity,
  selectedArea,
  onFilterChange,
}: Props) {
  const [categories, setCategories] = useState<ICategory[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Category</h3>
        <select
          value={selectedCategory}
          onChange={(e) => onFilterChange({ category: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.slug}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">City</h3>
        <input
          type="text"
          value={selectedCity}
          onChange={(e) => onFilterChange({ city: e.target.value })}
          placeholder="Enter city"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Area</h3>
        <input
          type="text"
          value={selectedArea}
          onChange={(e) => onFilterChange({ area: e.target.value })}
          placeholder="Enter area"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {(selectedCategory || selectedCity || selectedArea) && (
        <button
          onClick={() => onFilterChange({ category: "", city: "", area: "" })}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
