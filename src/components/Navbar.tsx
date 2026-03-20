"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

const PERMISSION_NAV: Record<string, { label: string; href: string }> = {
  admin_panel: { label: "Admin Panel", href: "/admin" },
  agent_panel: { label: "Agent Panel", href: "/agent" },
  business_panel: { label: "Business Panel", href: "/business-panel" },
};

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const permissions = session?.user?.permissions || [];
  const links = permissions
    .map((key) => PERMISSION_NAV[key])
    .filter(Boolean);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            <span className="text-xl font-bold text-blue-600">VIPANI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4">
            {session ? (
              <>
                <span className="text-sm text-gray-600">
                  Hi, {session.user?.name}
                </span>
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-gray-700 hover:text-blue-600"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/favorites"
                  className="text-sm text-gray-700 hover:text-blue-600"
                >
                  Favorites
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-600 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="sm:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-4 space-y-2">
            {session ? (
              <>
                <p className="text-sm text-gray-600 px-2">
                  Hi, {session.user?.name}
                </p>
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-2 py-1 text-sm text-gray-700 hover:text-blue-600"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/favorites"
                  className="block px-2 py-1 text-sm text-gray-700 hover:text-blue-600"
                  onClick={() => setMenuOpen(false)}
                >
                  Favorites
                </Link>
                <button
                  onClick={() => signOut()}
                  className="block px-2 py-1 text-sm text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block px-2 py-1 text-sm text-blue-600 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
