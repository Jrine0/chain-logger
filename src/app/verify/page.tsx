"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export default function VerifyPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="gradient-hero text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Public Verification</h1>
          <p className="mt-2 text-white/70">
            Verify invoices and evidence on Polygon. No wallet required.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Verification is public — no authentication needed. Anyone can verify records on-chain.
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="text-xl font-bold text-gray-900">Verify a Record</h2>
          <p className="mt-1 text-sm text-gray-500">Look up any invoice or evidence record on-chain.</p>

          {/* Placeholder — will be wired to contract in later phases */}
          <div className="mt-6 text-center py-8">
            <div className="text-4xl mb-3">⛓️</div>
            <h3 className="text-lg font-semibold text-gray-900">Coming Soon</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Contract integration for on-chain verification is being wired up. Check back soon.
            </p>
            {isAuthenticated && (
              <Link href="/dashboard" className="inline-block mt-4 text-brand-700 hover:text-brand-800 text-sm font-medium">
                Go to Dashboard →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
