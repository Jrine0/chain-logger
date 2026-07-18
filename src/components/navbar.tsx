"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { polygonAmoy } from "wagmi/chains";

export function Navbar() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  return (
    <nav className="bg-brand-900 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="text-2xl">🔗</span>
          ChainLogger
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/dashboard">Public Dashboard</NavLink>
          <NavLink href="/finance">Finance</NavLink>
          <NavLink href="/vendor">Vendor Portal</NavLink>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && (
            <span className={`hidden text-xs sm:inline rounded-full px-2 py-0.5 ${
              chainId === polygonAmoy.id
                ? "bg-green-800 text-green-200"
                : "bg-red-800 text-red-200"
            }`}>
              {chainId === polygonAmoy.id ? "Amoy" : `Chain ${chainId}`}
            </span>
          )}

          {isConnected && address && (
            <span className="hidden text-sm text-brand-200 sm:inline">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          )}

          {isConnected ? (
            <Button variant="ghost" size="sm" onClick={() => disconnect()}>
              Disconnect
            </Button>
          ) : (
            <Button size="sm" onClick={() => connect({ connector: connectors[0] })}>
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded px-3 py-1.5 text-sm font-medium text-brand-100 transition-colors hover:bg-brand-800 hover:text-white"
    >
      {children}
    </Link>
  );
}
