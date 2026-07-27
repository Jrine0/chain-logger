"use client";

import { useState } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { formatUsd, formatDate, validateRequired } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Navbar } from "@/components/navbar";
import { Card, Badge, Button, Input, StatCard } from "@/components/ui";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;
const PAGE_SIZE = 10;

const statusLabels: Record<number, string> = {
  0: "Active",
  1: "Completed",
  2: "Suspended",
  3: "Closed",
};
const statusColors: Record<number, "info" | "success" | "warning" | "default"> = {
  0: "info",
  1: "success",
  2: "warning",
  3: "default",
};

export default function ProjectsPage() {
  return (
    <ProtectedRoute requiredRole="finance">
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-enter">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="mt-1 text-gray-500">Create and manage transparency-tracked projects.</p>
          </div>

          <CreateProjectForm />

          <ProjectsTable />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function CreateProjectForm() {
  const { data: hash, writeContract, isPending } = useWriteContract();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
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
      const n = validateRequired(name, "Project name");
      const desc = description.trim();
      const cid = validateRequired(ipfsCid, "IPFS CID");
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CHAIN_LOGGER_ABI,
        functionName: "createProject",
        args: [n, desc, cid],
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid input");
    }
  };

  if (submitted && hash) {
    return (
      <Card className="mb-8">
        <div className="text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-semibold text-gray-900">Project Created</h3>
          <p className="mt-2 text-sm text-gray-500">Transaction confirmed on Polygon.</p>
          <p className="mt-1 text-xs text-gray-400 font-mono break-all">TX: {hash}</p>
          <Button variant="ghost" className="mt-4" onClick={() => {
            setName("");
            setDescription("");
            setIpfsCid("");
            setSubmitted(false);
          }}>Create Another Project</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900">Create New Project</h3>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Input label="Project Name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} required />
        <Input label="Description" value={description} onChange={(e) => { setDescription(e.target.value); setError(null); }} />
        <Input label="Project Document IPFS CID" value={ipfsCid} onChange={(e) => { setIpfsCid(e.target.value); setError(null); }} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create Project"}</Button>
        {hash && <p className="text-xs text-gray-500">TX: {hash}</p>}
      </form>
    </Card>
  );
}

function ProjectsTable() {
  const [page, setPage] = useState(0);
  const { data: total } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalProjects",
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 30_000 },
  });

  const count = total ? Number(total) : 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const pageSlice = safePage >= 0 ? Array.from({ length: Math.min(PAGE_SIZE, Math.max(0, count - safePage * PAGE_SIZE)) }, (_, i) => {
    const id = count - 1 - safePage * PAGE_SIZE - i;
    return id >= 0 ? id : -1;
  }).filter(id => id >= 0) : [];

  if (count === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-gray-900">No Projects Yet</h3>
          <p className="mt-2 text-sm text-gray-500">Create a project above to get started.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4">
        <StatCard label="Total Projects" value={count} icon="📋" accent="maroon" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">ID</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">Name</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">Allocated</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">Spent</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">Status</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">Created</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-500">IPFS</th>
            </tr>
          </thead>
          <tbody>
            {pageSlice.map((id) => <ProjectRow key={id} id={id} />)}
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

function ProjectRow({ id }: { id: number }) {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getProject",
    args: [BigInt(id)],
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  if (!data) return null;
  const [, name, description, ipfsCid, manager, totalAllocated, totalSpent, createdAt, , status, exists] = data;
  if (!exists) return null;

  const statusNum = Number(status);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-3.5 font-mono text-sm font-medium text-gray-700">#{id}</td>
      <td className="px-5 py-3.5">
        <div className="text-sm font-medium text-gray-900">{name}</div>
        {description && <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate" title={description}>{description}</div>}
      </td>
      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{formatUsd(totalAllocated)}</td>
      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{formatUsd(totalSpent)}</td>
      <td className="px-5 py-3.5">
        <Badge variant={statusColors[statusNum]}>{statusLabels[statusNum] || `#${statusNum}`}</Badge>
      </td>
      <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(createdAt)}</td>
      <td className="px-5 py-3.5 text-sm text-gray-500 font-mono text-xs max-w-xs truncate" title={ipfsCid}>
        {ipfsCid ? <span className="text-maroon-600">{ipfsCid.slice(0, 10)}...</span> : "—"}
      </td>
    </tr>
  );
}
