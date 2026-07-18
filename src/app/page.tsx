"use client";

import { Navbar } from "@/components/navbar";
import { StatCard } from "@/components/ui";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-brand-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-brand-800 px-3 py-1 text-sm font-medium text-brand-200">
              Blockchain-Verified Transparency
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">
              Every Dollar.
              <br />
              Every Project.
              <br />
              <span className="text-brand-300">On Chain.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-brand-100">
              ChainLogger immutably anchors fund allocations, invoices, and impact evidence
              to public cryptographic infrastructure — so donors and stakeholders can verify
              impact in real time.
            </p>
            <div className="mt-8 flex gap-4">
              <Link
                href="/dashboard"
                className="rounded-lg bg-white px-6 py-3 font-semibold text-brand-900 transition-colors hover:bg-gray-100"
              >
                View Public Dashboard →
              </Link>
              <Link
                href="/finance"
                className="rounded-lg border border-brand-600 px-6 py-3 font-semibold text-brand-100 transition-colors hover:bg-brand-800"
              >
                Finance Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-gray-900">How It Works</h2>
        <p className="mt-2 text-center text-gray-500">
          Post-receipt fund tracking, from bank to blockchain.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-5">
          <FlowStep step={1} title="Donation Received" description="Funds clear the organization's verified bank account." />
          <FlowStep step={2} title="Receipt Recorded" description="Finance team records the receipt on-chain with bank reference and SHA-256 hash." />
          <FlowStep step={3} title="Funds Allocated" description="Finance allocates funds to specific projects, each tied to a source receipt." />
          <FlowStep step={4} title="Invoices & Evidence" description="Vendors/NGOs upload invoices and execution evidence to IPFS; hashes are anchored on-chain." />
          <FlowStep step={5} title="Public Verification" description="Dashboard auto-updates, letting anyone verify the complete fund flow on Polygon." />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold text-gray-900">Platform Stats</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Receipts" value="—" icon="📥" subtitle="On-chain donation records" />
            <StatCard label="Projects" value="—" icon="📁" subtitle="Active initiatives" />
            <StatCard label="Invoices" value="—" icon="📄" subtitle="Processed invoices" />
            <StatCard label="Evidence" value="—" icon="🔒" subtitle="SHA-256 anchored documents" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-2xl bg-brand-800 px-8 py-12 text-center text-white md:px-16">
          <h2 className="text-3xl font-bold">Ready to verify transparency?</h2>
          <p className="mt-3 text-brand-200">
            Connect your wallet and explore the public dashboard or log in as a team member.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/dashboard" className="rounded-lg bg-white px-6 py-3 font-semibold text-brand-900 hover:bg-gray-100">
              Public Dashboard
            </Link>
            <Link href="/finance" className="rounded-lg border border-brand-400 px-6 py-3 font-semibold hover:bg-brand-700">
              Finance Portal
            </Link>
            <Link href="/vendor" className="rounded-lg border border-brand-400 px-6 py-3 font-semibold hover:bg-brand-700">
              Vendor Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-gray-500">
          ChainLogger — Transparency on Polygon. Built with Next.js, Wagmi, Viem & Foundry.
        </div>
      </footer>
    </div>
  );
}

function FlowStep({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white">
        {step}
      </div>
      <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}
