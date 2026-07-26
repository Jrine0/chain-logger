"use client";

import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { formatUsd, formatDate } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Card, Badge, Button, StatCard, SectionTitle } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { polygon } from "wagmi/chains";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

const statusColors: Record<string, string> = {
  "0": "info",
  "1": "success",
  "2": "danger",
};

const statusLabels: Record<string, string> = {
  "0": "Recorded",
  "1": "Allocated",
  "2": "Refunded",
};

function DashboardContent() {
  const { isConnected } = useAccount();
  const { selectedOrg, role } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-enter">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedOrg ? `${selectedOrg.name} Dashboard` : "Organization Dashboard"}
          </h1>
          <p className="mt-2 text-gray-500">
            Real-time view of fund flows for your organization, recorded on Polygon.
            {!isConnected && (
              <span className="text-brand-600"> Connect your wallet to view your dashboard.</span>
            )}
          </p>
          {selectedOrg && (
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                role === "admin" ? "bg-purple-500/10 text-purple-300 border border-purple-500/20" :
                role === "finance" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" :
                role === "vendor" ? "bg-gold-500/10 text-gold-300 border border-gold-500/20" :
                "bg-gray-500/10 text-gray-300 border border-gray-500/20"
              }`}>
                {role || "viewer"}
              </span>
              <span className="text-gray-400">
                Org ID: #{selectedOrg.id} · Est. {formatDate(selectedOrg.createdAt)}
              </span>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>Live on {polygon.name}</span>
            <span className="font-mono text-xs text-gray-400">
              {CONTRACT_ADDRESS ? `${CONTRACT_ADDRESS.slice(0, 6)}...${CONTRACT_ADDRESS.slice(-4)}` : ""}
            </span>
          </div>
        </div>

        {!CONTRACT_ADDRESS && (
          <Card accent="coral">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium text-gray-900">Contract not configured</p>
                <p className="text-sm text-gray-500">
                  Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local and redeploy.
                </p>
              </div>
            </div>
          </Card>
        )}

        {CONTRACT_ADDRESS && (
          <>
            {/* Stats */}
            <StatsBar />

            {/* Fund Flow Summary */}
            <div className="mt-8">
              <Card accent="maroon" title="Fund Flow Summary" subtitle="Overview of all on-chain activity">
                <FundFlowSummary />
              </Card>
            </div>

            {/* Recent Activity Grid */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <Card title="Recent Receipts" subtitle="Latest on-chain transaction records" icon="📥" accent="maroon">
                <RecentReceipts />
              </Card>
              <Card title="Recent Projects" subtitle="Active fund allocation targets" icon="📁" accent="gold">
                <RecentProjects />
              </Card>
              <Card title="Recent Invoices" subtitle="Latest vendor submissions" icon="📄" accent="coral">
                <RecentInvoices />
              </Card>
              <Card title="Evidence Files" subtitle="SHA-256 anchored documents" icon="🔒" accent="maroon">
                <RecentEvidence />
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="viewer">
      <DashboardContent />
    </ProtectedRoute>
  );
}

function StatsBar() {
  const { data: totalReceipts } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalReceipts",
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 30_000 },
  });
  const { data: totalProjects } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalProjects",
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 30_000 },
  });
  const { data: totalInvoices } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalInvoices",
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 30_000 },
  });
  const { data: totalEvidence } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalEvidences",
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 30_000 },
  });

  const receipts = totalReceipts ? Number(totalReceipts) : 0;
  const projects = totalProjects ? Number(totalProjects) : 0;
  const invoices = totalInvoices ? Number(totalInvoices) : 0;
  const evidence = totalEvidence ? Number(totalEvidence) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Receipts"
        value={receipts}
        icon="📥"
        subtitle="Transaction records"
        accent="maroon"
      />
      <StatCard
        label="Projects"
        value={projects}
        icon="📁"
        subtitle="Active initiatives"
        accent="gold"
      />
      <StatCard
        label="Invoices"
        value={invoices}
        icon="📄"
        subtitle="Processed invoices"
        accent="coral"
      />
      <StatCard
        label="Evidence"
        value={evidence}
        icon="🔒"
        subtitle="Documents anchored"
        accent="maroon"
      />
    </div>
  );
}

function FundFlowSummary() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="text-center">
        <div className="text-3xl font-bold text-brand-700">100%</div>
        <div className="text-sm text-gray-500 mt-1">Funds Traced</div>
        <p className="text-xs text-gray-400 mt-1">Every receipt is allocated to a project</p>
      </div>
      <div className="text-center border-x border-gray-200">
        <div className="text-3xl font-bold text-gold-600">SHA-256</div>
        <div className="text-sm text-gray-500 mt-1">Cryptographic Proof</div>
        <p className="text-xs text-gray-400 mt-1">All documents hash-verified on-chain</p>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-coral-500">Polygon</div>
        <div className="text-sm text-gray-500 mt-1">Immutable Ledger</div>
        <p className="text-xs text-gray-400 mt-1">Permanent, auditable transaction history</p>
      </div>
    </div>
  );
}

function RecentReceipts() {
  const { data: total } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalReceipts",
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  const count = total ? Number(total) : 0;
  const recent = Array.from({ length: Math.min(count, 5) }, (_, i) => count - 1 - i);

  return (
    <div>
      {count === 0 ? (
        <p className="text-sm text-gray-500">No receipts yet.</p>
      ) : (
        <div className="space-y-3">
          {recent.map((idx) => (
            <ReceiptRow key={idx} id={idx} />
          ))}
        </div>
      )}
      {count > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link href="/finance/receipts">
            <Button variant="ghost" size="sm" className="w-full justify-center">
              View All Receipts →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function ReceiptRow({ id }: { id: number }) {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getReceipt",
    args: [BigInt(id)],
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  if (!data) return null;
  const [, , amount, senderName, bankReference, , createdAt, status, exists] = data;
  if (!exists) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700 text-sm font-bold">
          {id}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{senderName}</p>
          <p className="text-xs text-gray-400">
            {formatUsd(amount)} · Ref: {bankReference.slice(0, 12)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <Badge variant={statusColors[String(status)] as any}>{statusLabels[String(status)]}</Badge>
        <p className="text-xs text-gray-400 mt-1">{formatDate(createdAt)}</p>
      </div>
    </div>
  );
}

function RecentProjects() {
  const { data: total } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalProjects",
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  const count = total ? Number(total) : 0;
  return (
    <div>
      {count === 0 ? (
        <p className="text-sm text-gray-500">No projects created yet.</p>
      ) : (
        <p className="text-sm text-gray-500">Projects are visible once created on-chain.</p>
      )}
      {count > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link href="/finance/projects">
            <Button variant="ghost" size="sm" className="w-full justify-center">
              View All Projects →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function RecentInvoices() {
  const { data: total } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalInvoices",
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  const count = total ? Number(total) : 0;
  return (
    <div>
      {count === 0 ? (
        <p className="text-sm text-gray-500">No invoices submitted yet.</p>
      ) : (
        <p className="text-sm text-gray-500">Invoices are visible once submitted on-chain.</p>
      )}
      {count > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link href="/vendor/invoices">
            <Button variant="ghost" size="sm" className="w-full justify-center">
              View All Invoices →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function RecentEvidence() {
  const { data: total } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalEvidences",
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  const count = total ? Number(total) : 0;
  return (
    <div>
      {count === 0 ? (
        <p className="text-sm text-gray-500">No evidence uploaded yet.</p>
      ) : (
        <p className="text-sm text-gray-500">Evidence files appear here once uploaded.</p>
      )}
      {count > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link href="/vendor/evidence">
            <Button variant="ghost" size="sm" className="w-full justify-center">
              View All Evidence →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
