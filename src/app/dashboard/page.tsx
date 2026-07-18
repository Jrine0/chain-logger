"use client";

import { Navbar } from "@/components/navbar";
import { Card, Button } from "@/components/ui";
import { useAccount, useReadContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { formatCurrency } from "@/hooks/use-contract-formatters";
import { formatDate } from "@/lib/utils";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

function Dashboard() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Public Transparency Dashboard</h1>
          <p className="mt-1 text-gray-500">
            Real-time view of fund flows, recorded on Polygon.
            {!isConnected && <span className="text-brand-600"> Connect your wallet to interact.</span>}
          </p>
        </div>

        {!CONTRACT_ADDRESS && (
          <Card>
            <p className="text-center text-red-600">
              Contract not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local and redeploy.
            </p>
          </Card>
        )}

        {CONTRACT_ADDRESS && (
          <>
            <StatsBar />
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <RecentReceipts />
              <RecentProjects />
              <RecentInvoices />
              <RecentEvidence />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatsBar() {
  const { data: totalReceipts } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalReceipts",
    query: { enabled: !!CONTRACT_ADDRESS },
  });
  const { data: totalProjects } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalProjects",
    query: { enabled: !!CONTRACT_ADDRESS },
  });
  const { data: totalInvoices } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalInvoices",
    query: { enabled: !!CONTRACT_ADDRESS },
  });
  const { data: totalEvidence } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalEvidences",
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <p className="text-sm text-gray-500">Total Receipts</p>
        <p className="text-2xl font-bold">{totalReceipts ? Number(totalReceipts) : "—"}</p>
      </Card>
      <Card>
        <p className="text-sm text-gray-500">Projects</p>
        <p className="text-2xl font-bold">{totalProjects ? Number(totalProjects) : "—"}</p>
      </Card>
      <Card>
        <p className="text-sm text-gray-500">Invoices</p>
        <p className="text-2xl font-bold">{totalInvoices ? Number(totalInvoices) : "—"}</p>
      </Card>
      <Card>
        <p className="text-sm text-gray-500">Evidence Files</p>
        <p className="text-2xl font-bold">{totalEvidence ? Number(totalEvidence) : "—"}</p>
      </Card>
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
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Recent Receipts</h3>
      {count === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No receipts yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {recent.map((idx) => (
            <ReceiptRow key={idx} id={idx} />
          ))}
        </div>
      )}
    </Card>
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
  const [id_, donor, amount, donorName, bankReference, bankTxHash, createdAt, status, exists] = data;
  if (!exists) return null;

  return (
    <div className="rounded-lg border border-gray-100 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-gray-400">#{id_.toString()}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${
          status === 0 ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
        }`}>
          {status === 0 ? "Recorded" : "Allocated"}
        </span>
      </div>
      <p className="mt-1 font-medium">{donorName}</p>
      <p className="text-gray-600">{formatCurrency(amount)} — Ref: {bankReference}</p>
      <p className="text-xs text-gray-400">{formatDate(createdAt)}</p>
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
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Projects ({count})</h3>
      {count === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No projects created yet.</p>
      ) : (
        <p className="mt-4 text-sm text-gray-500">Projects are visible once created on-chain.</p>
      )}
    </Card>
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
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Invoices ({count})</h3>
      {count === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No invoices submitted yet.</p>
      ) : (
        <p className="mt-4 text-sm text-gray-500">Invoices are visible once submitted on-chain.</p>
      )}
    </Card>
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
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Evidence ({count})</h3>
      {count === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No evidence uploaded yet.</p>
      ) : (
        <p className="mt-4 text-sm text-gray-500">Evidence files appear here once uploaded.</p>
      )}
    </Card>
  );
}

export default Dashboard;
