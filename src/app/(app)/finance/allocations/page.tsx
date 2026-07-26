"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { validateRequired } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Card, Button, Input } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/protected-route";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

export default function AllocationsPage() {
  return (
    <ProtectedRoute requiredRole="finance">
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Allocations</h1>
            <p className="mt-1 text-gray-500">Allocate funds from receipts to projects.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <CreateAllocationForm />
            <AllocationInfo />
          </div>
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
      <Card>
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
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Allocate Funds</h3>
      <p className="mt-1 text-sm text-gray-500">Transfer funds from a receipt to a project.</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Receipt ID" type="number" value={receiptId} onChange={(e) => setReceiptId(e.target.value)} required />
          <Input label="Project ID" type="number" value={projectId} onChange={(e) => setProjectId(e.target.value)} required />
        </div>
        <Input label="Amount (USD)" type="number" step="0.01" placeholder="5000.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <Input label="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Program implementation" required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isPending}>{isPending ? "Allocating..." : "Allocate Funds"}</Button>
      </form>
    </Card>
  );
}

function AllocationInfo() {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">How Allocations Work</h3>
      <div className="mt-4 space-y-4 text-sm text-gray-600">
        <p>Allocations connect receipts (incoming funds) to projects (spending targets). Each allocation:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>References a specific receipt ID</li>
          <li>Targets a specific project ID</li>
          <li>Cannot exceed the receipt&apos;s remaining balance</li>
          <li>Is immutable once recorded on-chain</li>
        </ul>
        <p className="text-xs text-gray-400">Find receipt and project IDs in the Receipts and Projects pages.</p>
      </div>
    </Card>
  );
}
