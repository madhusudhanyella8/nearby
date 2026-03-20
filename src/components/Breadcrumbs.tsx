"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center text-sm text-gray-500 mb-6">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          {i > 0 && <span className="mx-2">&gt;</span>}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="hover:text-blue-600">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-800 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
