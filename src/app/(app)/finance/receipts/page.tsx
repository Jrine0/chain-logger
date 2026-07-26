"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { formatUsd, formatDate, usdToCents, validateRequired } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Navbar } from "@/components/navbar";
import { Card, Badge, Button, Input, StatCard } from "@/components/ui";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;
const PAGE_SIZE = 10;

const statusColors: Record<string, "info" | "success" | "danger"> = { "0": "info", "1": "success", "2": "danger" };
const statusLabels: Record<string, string> = { "0": "Recorded", "1": "Allocated", "2": "Refunded" };

export default function ReceiptsPage() {
  const { data: total } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalReceipts",
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 30_000 },
  });

  return (
    <ProtectedRoute requiredRole="finance">
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-enter">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
            <p className="mt-1 text-gray-500">
              {total ? Number(total) : 0} receipt{(Number(total) || 0) !== 1 ? "s" : ""} on-chain.
            </p>
          </div>

          {total && Number(total) > 0 && (
            <div className="mb-8">
              <StatCard label="Total Receipts" value={Number(total)} icon="📥" accent="maroon" />
            </div>
          )}

          <ReceiptTable count={total ? Number(total) : 0} />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function ReceiptTable({ count }: { count: number }) {
  const [page, setPage] = useState(0);
  const [form, setForm] = useState({ senderName: "", bankReference: "", amount: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { data: onHash, writeContract, isPending } = useWriteContract();

  useEffect(() => { setPage(0); }, [count]);
  useEffect(() => { if (onHash) setTxHash(onHash); }, [onHash]);

  const pageSize = count > 0 ? Math.min(PAGE_SIZE, count) : 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const start = Math.max(0, count - 1 - page * PAGE_SIZE);
  const ids = pageSize > 0 ? Array.from({ length: pageSize }, (_, i) => start - i) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!CONTRACT_ADDRESS) {
      setError("Contract address not configured.");
      return;
    }
    try {
      const name = validateRequired(form.senderName, "Sender name");
      const ref = validateRequired(form.bankReference, "Bank reference");
      const amt = BigInt(usdToCents(parseFloat(form.amount) || 0));
      if (!CONTRACT_ADDRESS) { setError("Contract address not configured."); return; }
      const addr = CONTRACT_ADDRESS!;
      writeContract({
        address: addr,
        abi: CHAIN_LOGGER_ABI,
        functionName: "recordReceipt",
        args: [name, amt, ref, "web3-submission"],
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid input");
    }
  };

  return (
    <div className="space-y-8">
      <Card accent="maroon" title="Record New Receipt" subtitle="Log a new bank transaction on-chain">
        {submitted && txHash ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-semibold text-gray-900">Receipt Recorded</h3>
            <p className="mt-2 text-sm text-gray-500">Transaction confirmed on Polygon.</p>
            <p className="mt-1 text-xs text-gray-400 font-mono break-all">TX: {txHash}</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => {
                setForm({ senderName: "", bankReference: "", amount: "" });
                setSubmitted(false);
                setTxHash(null);
              }}
            >
              Record Another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Sender Name"
                value={form.senderName}
                onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                placeholder="Donor or organization name"
              />
              <Input
                label="Bank Reference"
                value={form.bankReference}
                onChange={(e) => setForm({ ...form, bankReference: e.target.value })}
                placeholder="TXN-XXXXXX"
              />
            </div>
            <Input
              label="Amount (USD)"
              type="number"
              step="0.01"
              placeholder="10000.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Recording..." : "Record Receipt"}
            </Button>
          </form>
        )}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">ID</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">Sender</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">Amount</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">Reference</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">Date</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {count === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No receipts recorded yet.
                  </td>
                </tr>
              ) : (
                ids.map((idx) => <ReceiptRow key={idx} id={idx} />)
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
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
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-3.5 font-mono text-sm font-medium text-gray-700">#{id}</td>
      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{senderName}</td>
      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{formatUsd(amount)}</td>
      <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">{bankReference}</td>
      <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(createdAt)}</td>
      <td className="px-5 py-3.5">
        <Badge variant={statusColors[String(status)]}>{statusLabels[String(status)]}</Badge>
      </td>
    </tr>
  );
}
