"use client";

import { Navbar } from "@/components/navbar";
import { Card, Button, Input, Textarea } from "@/components/ui";
import { useAccount } from "wagmi";
import { useReadContract, useWriteContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { usdToCents, validatePositiveNumber, safeBigInt, validateRequired } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

function ReceiptForm() {
  const { address, isConnected } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const [donorName, setDonorName] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [bankTxHash, setBankTxHash] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isConnected || !address) {
    return (
      <Card className="text-center">
        <p className="text-gray-500">Connect your wallet as a Finance team member to record receipts.</p>
      </Card>
    );
  }

  if (!CONTRACT_ADDRESS) {
    return (
      <Card className="text-center">
        <p className="text-red-600">Contract not deployed. Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local.</p>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const name = validateRequired(donorName, "Donor name");
      const usd = validatePositiveNumber(amount, "Amount");
      const ref = validateRequired(reference, "Bank reference");
      const txHash = validateRequired(bankTxHash, "Bank transaction hash");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CHAIN_LOGGER_ABI,
        functionName: "recordReceipt",
        args: [name, usdToCents(usd), ref, txHash],
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
          <h3 className="text-lg font-semibold text-gray-900">Receipt Submitted</h3>
          <p className="mt-2 text-sm text-gray-500">Transaction is being confirmed on Polygon.</p>
          <p className="mt-1 text-xs text-gray-400 font-mono break-all">TX: {hash}</p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => {
              setDonorName("");
              setAmount("");
              setReference("");
              setBankTxHash("");
              setSubmitted(false);
            }}
          >
            Record Another Receipt
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Record New Donation Receipt</h3>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Input label="Donor Name" value={donorName} onChange={(e) => { setDonorName(e.target.value); setError(null); }} required />
        <Input label="Amount (USD)" type="number" step="0.01" placeholder="5000.00" value={amount} onChange={(e) => { setAmount(e.target.value); setError(null); }} required />
        <Input label="Bank Transaction Reference" placeholder="TXN-2024-001" value={reference} onChange={(e) => { setReference(e.target.value); setError(null); }} required />
        <Input label="Bank Transaction Hash / ID" placeholder="Bank-provided transaction identifier" value={bankTxHash} onChange={(e) => { setBankTxHash(e.target.value); setError(null); }} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isPending}>{isPending ? "Recording..." : "Record Receipt on Chain"}</Button>
      </form>
    </Card>
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

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Receipt Registry</h3>
      <p className="mt-1 text-sm text-gray-500">{count} receipt{count !== 1 ? "s" : ""} recorded on-chain.</p>
    </Card>
  );
}

export default function FinanceDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finance Team Dashboard</h1>
          <p className="mt-1 text-gray-500">Record receipts, create projects, and allocate funds.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ReceiptForm />
          </div>
          <div className="space-y-6">
            <RecentReceipts />
            <Card>
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
              <div className="mt-4 space-y-2">
                <Link href="/finance/projects">
                  <Button variant="ghost" className="w-full justify-start">📁 Create Project</Button>
                </Link>
                <Link href="/finance/allocations">
                  <Button variant="ghost" className="w-full justify-start">💰 Allocate Funds</Button>
                </Link>
                <Link href="/finance/receipts">
                  <Button variant="ghost" className="w-full justify-start">📋 View All Receipts</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
