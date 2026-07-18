"use client";

import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default function VendorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-brand-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <Link href="/" className="text-sm text-brand-300 hover:text-white">← Back to Home</Link>
          <h1 className="mt-4 text-3xl font-bold">Vendor / NGO Portal</h1>
          <p className="mt-2 text-brand-200">Submit invoices and upload evidence for funded projects.</p>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-12">
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
    <Link href={href} className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <span className="mt-4 inline-block text-sm font-medium text-brand-600">Open →</span>
    </Link>
  );
}
