"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

const ROLE_LINKS: Record<string, { href: string; label: string }[]> = {
  admin: [
    { href: "/admin", label: "Admin Panel" },
    { href: "/admin/businesses", label: "All Businesses" },
    { href: "/requests", label: "Requests" },
  ],
  agent: [
    { href: "/agent", label: "Dashboard" },
    { href: "/agent/register", label: "+ Register Business" },
    { href: "/requests", label: "Requests" },
  ],
  business_owner: [
    { href: "/dashboard", label: "My Businesses" },
    { href: "/register-business", label: "Request New Business" },
    { href: "/requests", label: "My Requests" },
  ],
  user: [
    { href: "/favorites", label: "Favorites" },
  ],
};

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = session?.user?.role || "";
  const links = ROLE_LINKS[role] || [];

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
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-600 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-700 hover:text-blue-600"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
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
                <button
                  onClick={() => signOut()}
                  className="block px-2 py-1 text-sm text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-2 py-1 text-sm text-gray-700"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block px-2 py-1 text-sm text-blue-600 font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
