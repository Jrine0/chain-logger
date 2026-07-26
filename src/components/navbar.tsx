"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { Button } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { polygon } from "wagmi/chains";

export function Navbar() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { role, selectedOrg, isLoadingRole } = useAuth();

  const isOnLanding = typeof window !== "undefined" && window.location.pathname === "/";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-brand-900/10 bg-brand-900/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 py-3 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-400 text-brand-900 font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            C
          </span>
          <span className="text-lg font-bold text-white tracking-tight">
            Chain<span className="text-gold-300">Logger</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Show Verify + Sign In on landing when not connected */}
          {!isConnected && (
            <>
              <Link href="/verify" className="hidden sm:block">
                <span className="text-sm font-medium text-brand-200 hover:text-white transition-colors px-3 py-1.5">
                  Verify
                </span>
              </Link>
              <Link href="/auth">
                <Button
                  size="sm"
                  className="!bg-gold-400 !text-brand-900 hover:!bg-gold-300 font-semibold shadow-sm"
                >
                  Sign In
                </Button>
              </Link>
            </>
          )}

          {/* Loading state */}
          {isConnected && isLoadingRole && (
            <div className="animate-spin h-5 w-5 rounded-full border-2 border-brand-200 border-t-transparent" />
          )}

          {/* Logged in state */}
          {isConnected && !isLoadingRole && (
            <>
              {/* Navigation links */}
              <div className="hidden items-center gap-1 rounded-full bg-brand-800/60 px-1.5 py-1.5 backdrop-blur-sm md:flex">
                <NavLink href="/dashboard" label="Dashboard" />
                <NavLink href="/verify" label="Verify" />
              </div>

              {/* Chain badge */}
              {chainId === polygon.id && (
                <span className="hidden text-xs font-medium rounded-full px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 sm:inline">
                  <span className="inline-block h-1.5 w-1.5 rounded-full mr-1.5 bg-current" />
                  Polygon
                </span>
              )}

              {/* Address */}
              {address && (
                <span className="hidden text-xs text-brand-200 font-mono sm:inline">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              )}

              {/* Role badge */}
              <span className={`hidden text-xs font-medium rounded-full px-2.5 py-1 sm:inline ${
                role === "admin" ? "bg-purple-500/10 text-purple-300 border border-purple-500/20" :
                role === "finance" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" :
                role === "vendor" ? "bg-gold-500/10 text-gold-300 border border-gold-500/20" :
                "bg-gray-500/10 text-gray-300 border border-gray-500/20"
              }`}>
                {role || "viewer"}
              </span>

              {/* Org name */}
              {selectedOrg && (
                <span className="hidden text-xs text-gold-300 font-medium sm:inline max-w-[120px] truncate">
                  {selectedOrg.name}
                </span>
              )}

              {/* Disconnect */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => disconnect()}
                className="text-brand-200 hover:text-white hover:bg-brand-800"
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex items-center justify-around border-t border-brand-800/50 px-4 py-1.5 md:hidden">
        {!isConnected ? (
          <>
            <MobileNavLink href="/verify" label="Verify" />
            <MobileNavLink href="/auth" label="Sign In" />
          </>
        ) : (
          <>
            <MobileNavLink href="/dashboard" label="Dashboard" />
            <MobileNavLink href="/verify" label="Verify" />
          </>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-1.5 text-sm font-medium text-brand-200 transition-all duration-200 hover:text-white hover:bg-brand-700/60"
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-xs font-medium text-brand-300 transition-colors hover:text-gold-300"
    >
      {label}
    </Link>
  );
}
