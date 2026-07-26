"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, selectedOrg } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-brand-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {selectedOrg ? `${selectedOrg.name} Dashboard` : "Your Dashboard"}
        </h1>
        <p className="mt-2 text-gray-500">
          Welcome back{selectedOrg ? ` to ${selectedOrg.name}` : ""}. Here&apos;s an overview of your organization&apos;s activity.
        </p>
        {selectedOrg && (
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium bg-brand-50 text-brand-700 border border-brand-100 capitalize">
              {selectedOrg.role}
            </span>
            <span className="text-gray-400">
              Org ID: #{selectedOrg.id}
            </span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ActionCard href="/finance/receipts" icon="📥" title="Record Receipt" description="Log a new bank transaction" />
        <ActionCard href="/finance/projects" icon="📁" title="Create Project" description="Start a new initiative" />
        <ActionCard href="/vendor/invoices" icon="📄" title="Submit Invoice" description="Bill against an allocation" />
        <ActionCard href="/verify" icon="🔍" title="Verify Data" description="Look up on-chain records" />
      </div>

      {/* Getting started */}
      {!selectedOrg && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-8 text-center">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-xl font-bold text-gray-900">Create your organization to get started</h2>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            Set up your organization to start recording receipts, creating projects, and tracking funds on-chain.
          </p>
          <Link href="/org/create" className="inline-block mt-6 rounded-xl bg-brand-700 text-white font-medium px-6 py-2.5 hover:bg-brand-800 transition-colors">
            Create Organization →
          </Link>
        </div>
      )}
    </div>
  );
}

function ActionCard({ href, icon, title, description }: { href: string; icon: string; title: string; description: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md hover:border-brand-200 transition-all group">
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  );
}
