"use client";

import { useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { formatUsd, formatDate, validateRequired } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Navbar } from "@/components/navbar";
import { Card, Badge, Button, Input, StatCard } from "@/components/ui";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;
const PAGE_SIZE = 10;

type SortKey = "id" | "amount" | "date";
type SortDir = "asc" | "desc";

export default function AllocationsPage() {
  return (
    <ProtectedRoute requiredRole="finance">
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-enter">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Allocations</h1>
            <p className="mt-1 text-gray-500">Track fund transfers from receipts to projects.</p>
          </div>

          <CreateAllocationForm />
          <AllocationsTable />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function CreateAllocationForm() {
  const { data: hash, writeContract, isPending } = useWriteContract();
  const [receiptId, setReceiptId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!CONTRACT_ADDRESS) {
      setError("Contract address not configured.");
      return;
    }

    try {
      const rId = validateRequired(receiptId, "Receipt ID");
      const pId = validateRequired(projectId, "Project ID");
      const amt = BigInt(Math.round(parseFloat(amount) * 100));
      const purp = validateRequired(purpose, "Purpose");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CHAIN_LOGGER_ABI,
        functionName: "allocateFunds",
        args: [BigInt(rId), BigInt(pId), amt, purp],
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid input");
    }
  };

  if (submitted && hash) {
    return (
      <Card accent="maroon" className="mb-8">
        <div className="text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-semibold text-gray-900">Funds Allocated</h3>
          <p className="mt-2 text-sm text-gray-500">Transaction confirmed on Polygon.</p>
          <p className="mt-1 text-xs text-gray-400 font-mono break-all">TX: {hash}</p>
          <Button variant="ghost" className="mt-4" onClick={() => {
            setReceiptId(""); setProjectId(""); setAmount(""); setPurpose(""); setSubmitted(false);
          }}>Allocate More</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card accent="maroon" title="Allocate Funds" subtitle="Transfer funds from a receipt to a project" className="mb-8">
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Receipt ID" type="number" value={receiptId} onChange={(e) => setReceiptId(e.target.value)} placeholder="Receipt to allocate from" required />
          <Input label="Project ID" type="number" value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Project to fund" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Amount (USD)" type="number" step="0.01" placeholder="5000.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Input label="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Program implementation" required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isPending}>{isPending ? "Allocating..." : "Allocate Funds"}</Button>
      </form>
    </Card>
  );
}

function AllocationsTable() {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: totalAllocations } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalAllocations",
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 30_000 },
  });

  const totalCount = totalAllocations ? Number(totalAllocations) : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const pageSlice = safePage >= 0 ? Array.from({ length: Math.min(PAGE_SIZE, Math.max(0, totalCount - safePage * PAGE_SIZE)) }, (_, i) => {
    const id = totalCount - 1 - safePage * PAGE_SIZE - i;
    return id >= 0 ? id : -1;
  }).filter(id => id >= 0) : [];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-gray-500 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  if (totalCount === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-gray-900">No Allocations Yet</h3>
          <p className="mt-2 text-sm text-gray-500">Allocate funds from a receipt to a project to get started.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4">
        <StatCard label="Total Allocated" value={`$${totalCount.toLocaleString()}`} icon="💰" accent="maroon" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <SortableHeader col="id" label="ID" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader col="amount" label="Amount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">Receipt</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">Project</th>
              <SortableHeader col="date" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {pageSlice.map((id) => <AllocationRow key={id} id={id} />)}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">Page {safePage + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={safePage === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={safePage >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function SortableHeader({ col, label, sortKey, sortDir, onSort }: { col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir; onSort: (k: SortKey) => void }) {
  return (
    <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500 cursor-pointer hover:text-gray-700 select-none" onClick={() => onSort(col)}>
      <span className="flex items-center">{label}<SortIconUI active={sortKey === col} direction={sortDir} /></span>
    </th>
  );
}

function SortIconUI({ active, direction }: { active: boolean; direction: SortDir }) {
  if (!active) return <span className="text-gray-300 ml-1">↕</span>;
  return <span className="text-gray-500 ml-1">{direction === "asc" ? "↑" : "↓"}</span>;
}

function AllocationRow({ id }: { id: number }) {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getAllocation",
    args: [BigInt(id)],
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  if (!data) return null;
  const [, receiptId, projectId, amount, purpose, createdAt, exists] = data;
  if (!exists) return null;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-3.5 font-mono text-sm font-medium text-gray-700">#{id}</td>
      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{formatUsd(amount)}</td>
      <td className="px-5 py-3.5 text-sm text-gray-500">
        <a href={`#`} className="text-maroon-600 hover:text-maroon-800 font-medium">#{Number(receiptId)}</a>
      </td>
      <td className="px-5 py-3.5 text-sm text-gray-500">
        <a href={`#`} className="text-maroon-600 hover:text-maroon-800 font-medium">#{Number(projectId)}</a>
      </td>
      <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(createdAt)}</td>
      <td className="px-5 py-3.5 text-sm text-gray-600 max-w-xs truncate" title={purpose}>{purpose}</td>
    </tr>
  );
}
