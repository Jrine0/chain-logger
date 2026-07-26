"use client";

import { Navbar } from "@/components/navbar";
import { StatCard, Badge, Card, Button, TrustBadge, SectionTitle } from "@/components/ui";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-yellow-200 backdrop-blur-sm border border-white/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Blockchain-Verified Transparency
              </span>
            </div>

            <h1 className="mt-8 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Every Transaction.
              <br />
              Every Project.
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                On Chain.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-brand-200 leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
              ChainLogger immutably anchors fund allocations, invoices, and impact evidence
              to public cryptographic infrastructure — so stakeholders can verify
              impact in real time.
            </p>

            <div className="mt-10 flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Link href="/auth">
                <Button size="lg" variant="primary">
                  Get Started →
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-gold-400/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-coral-500/5 blur-3xl" />
      </section>

      {/* Trust Badges */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            <TrustBadge icon="🔗" label="Polygon Secured" />
            <TrustBadge icon="🔒" label="SHA-256 Verified" />
            <TrustBadge icon="📁" label="IPFS Stored" />
            <TrustBadge icon="✅" label="Open & Auditable" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionTitle
          title="How It Works"
          description="From bank transaction to on-chain verification in 5 steps."
        />

        <div className="relative mt-14">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-brand-200 via-gold-300 to-brand-200" />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 stagger-children">
            <FlowStep step={1} title="Transaction Received" description="Funds clear the organization's verified bank account." />
            <FlowStep step={2} title="Receipt Recorded" description="Finance records the transaction on-chain with bank reference and SHA-256 hash." />
            <FlowStep step={3} title="Funds Allocated" description="Finance allocates funds to specific projects, each tied to a source receipt." />
            <FlowStep step={4} title="Invoices & Evidence" description="Vendors upload invoices and execution evidence to IPFS; hashes are anchored on-chain." />
            <FlowStep step={5} title="Public Verification" description="Dashboard auto-updates, letting anyone verify the complete fund flow on Polygon." />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionTitle
            title="Platform Overview"
            description="Live metrics from the Polygon blockchain."
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            <StatCard label="Receipts" value="—" icon="📥" subtitle="On-chain transaction records" accent="maroon" />
            <StatCard label="Projects" value="—" icon="📁" subtitle="Active initiatives" accent="gold" />
            <StatCard label="Invoices" value="—" icon="📄" subtitle="Processed invoices" accent="coral" />
            <StatCard label="Evidence" value="—" icon="🔒" subtitle="SHA-256 anchored documents" accent="maroon" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl gradient-maroon px-8 py-14 text-center text-white md:px-16 shadow-xl">
          {/* Decorative */}
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to verify transparency?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-brand-200 text-lg">
              Connect your wallet and explore the public dashboard or log in as a team member.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/auth">
                <Button size="lg" variant="primary">
                  Get Started →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white font-bold text-sm">C</span>
              <span className="font-bold text-gray-900">ChainLogger</span>
            </div>
            <p className="text-sm text-gray-500">
              Transparency on Polygon. Built with Next.js, Wagmi, Viem & Foundry.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/verify" className="text-sm text-gray-500 hover:text-brand-700 transition-colors">
                Verify
              </Link>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-100 pt-6 text-center">
            <p className="text-xs text-gray-400">
              ChainLogger — Post-receipt fund transparency on Polygon. Open source.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FlowStep({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Number circle */}
      <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-lg font-bold text-white shadow-lg shadow-brand-700/20 ring-4 ring-white">
        {step}
      </div>

      <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1.5 text-sm text-gray-500 leading-relaxed max-w-[200px]">{description}</p>
    </div>
  );
}
