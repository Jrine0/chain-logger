"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export function Navbar() {
  const pathname = usePathname() || "/";
  const { user, profile, signOut, isAuthenticated, selectedOrg, orgs, selectOrg } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white font-bold text-sm">
                C
              </div>
              <span className="font-bold text-gray-900 hidden sm:inline">ChainLogger</span>
            </Link>

            {!isAuthenticated && (
              <div className="hidden md:flex items-center gap-1">
                <NavLink href="/dashboard" label="Dashboard" current={pathname} />
                <NavLink href="/verify" label="Verify" current={pathname} />
                <NavLink href="/finance" label="Finance" current={pathname} />
                <NavLink href="/vendor" label="Vendor" current={pathname} />
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Org switcher */}
                {orgs.length > 1 && (
                  <select
                    value={selectedOrg?.id ?? ""}
                    onChange={(e) => selectOrg(Number(e.target.value))}
                    className="rounded-lg border border-gray-200 text-sm px-2.5 py-1.5 bg-white focus:border-brand-500 outline-none"
                  >
                    {orgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                )}

                {selectedOrg && (
                  <span className="hidden lg:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100 capitalize">
                    {selectedOrg.role}
                  </span>
                )}

                {/* User menu */}
                <div className="relative group">
                  <button className="flex items-center gap-2 rounded-lg hover:bg-gray-50 px-2 py-1 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                      {initials}
                    </div>
                    <span className="hidden sm:inline text-sm text-gray-700 max-w-[120px] truncate">
                      {profile?.full_name || user?.email}
                    </span>
                    <span className="text-gray-400 text-xs">▼</span>
                  </button>

                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-gray-200 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="py-1">
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Dashboard
                      </Link>
                      <Link href="/org/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Org Settings
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={signOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
                  Sign In
                </Link>
                <Link href="/register" className="rounded-lg bg-brand-700 text-white text-sm px-4 py-2 hover:bg-brand-800 transition-colors">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, label, current }: { href: string; label: string; current: string }) {
  const isActive = current === href;
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? "text-brand-700 bg-brand-50"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}
