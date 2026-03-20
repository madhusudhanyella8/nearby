"use client";

import Link from "next/link";

interface Props {
  name: string;
  slug: string;
  icon: string;
}

export default function CategoryCard({ name, slug, icon }: Props) {
  return (
    <Link
      href={`/search?category=${slug}`}
      className="flex flex-col items-center gap-2 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition group"
    >
      <span className="text-4xl group-hover:scale-110 transition-transform">
        {icon}
      </span>
      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
        {name}
      </span>
    </Link>
  );
}
