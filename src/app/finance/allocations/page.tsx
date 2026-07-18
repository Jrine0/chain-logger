"use client";

import { Navbar } from "@/components/navbar";
import { Card, Button, Input } from "@/components/ui";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { usdToCents, validatePositiveNumber, safeBigInt, validateRequired } from "@/lib/utils";
import { useState } from "react";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

function AllocateForm() {
  const { isConnected } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const [receiptId, setReceiptId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isConnected) {
    return (
      <Card className="text-center">
        <p className="text-gray-500">Connect your wallet as a Finance team member.</p>
      </Card>
    );
  }

  if (!CONTRACT_ADDRESS) {
    return <Card><p className="text-red-600">Contract address not configured.</p></Card>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const rid = safeBigInt(receiptId, "Receipt ID");
      const pid = safeBigInt(projectId, "Project ID");
      const usd = validatePositiveNumber(amount, "Amount");
      const desc = validateRequired(purpose, "Purpose");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CHAIN_LOGGER_ABI,
        functionName: "allocateFunds",
        args: [rid, pid, usdToCents(usd), desc],
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
            setReceiptId("");
            setProjectId("");
            setAmount("");
            setPurpose("");
            setSubmitted(false);
          }}>Allocate Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Allocate Funds to Project</h3>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Input label="Receipt ID" type="number" value={receiptId} onChange={(e) => { setReceiptId(e.target.value); setError(null); }} required />
        <Input label="Project ID" type="number" value={projectId} onChange={(e) => { setProjectId(e.target.value); setError(null); }} required />
        <Input label="Amount (USD)" type="number" step="0.01" placeholder="2500.00" value={amount} onChange={(e) => { setAmount(e.target.value); setError(null); }} required />
        <Input label="Purpose" value={purpose} onChange={(e) => { setPurpose(e.target.value); setError(null); }} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isPending}>{isPending ? "Allocating..." : "Allocate Funds"}</Button>
        {hash && <p className="text-xs text-gray-500">TX: {hash}</p>}
      </form>
    </Card>
  );
}

export default function AllocationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fund Allocations</h1>
          <p className="mt-1 text-gray-500">Allocate received funds to specific projects.</p>
        </div>
        <div className="max-w-2xl">
          <AllocateForm />
        </div>
      </div>
    </div>
  );
}
