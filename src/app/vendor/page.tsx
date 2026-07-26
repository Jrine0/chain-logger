"use client";

import { Navbar } from "@/components/navbar";
import { Card, Button } from "@/components/ui";
import Link from "next/link";

export default function VendorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="gradient-coral text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
            ← Back to Home
          </Link>
          <h1 className="mt-4 text-3xl font-bold">Vendor / NGO Portal</h1>
          <p className="mt-2 text-white/70">Submit invoices and upload evidence for funded projects.</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <LinkCard
            href="/vendor/invoices"
            icon="📄"
            title="Submit Invoice"
            description="Submit a new invoice against your fund allocation. Includes SHA-256 hash and IPFS document."
          />
          <LinkCard
            href="/vendor/evidence"
            icon="📁"
            title="Upload Evidence"
            description="Upload execution evidence (photos, reports, receipts) to IPFS and anchor hashes on-chain."
          />
        </div>
      </div>
    </div>
  );
}

function LinkCard({ href, icon, title, description }: { href: string; icon: string; title: string; description: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-gray-200 bg-white p-7 shadow-card hover-lift group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-50 text-3xl border border-coral-100">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-coral-500 transition-colors">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 leading-relaxed">{description}</p>
          </div>
        </div>
        <span className="text-xl text-gray-300 group-hover:text-coral-500 transition-colors">
          →
        </span>
      </div>
    </Link>
  );
}
