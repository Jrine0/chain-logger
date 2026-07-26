"use client";

import { useState } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { validateRequired, formatUsd } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Card, Badge, Button, Input } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/protected-route";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

const invoiceStatusLabels: Record<string, string> = {
  "0": "Submitted",
  "1": "Under Review",
  "2": "Approved",
  "3": "Rejected",
  "4": "Paid",
};
const invoiceStatusColors: Record<string, "info" | "warning" | "success" | "danger" | "info"> = {
  "0": "info",
  "1": "warning",
  "2": "success",
  "3": "danger",
  "4": "info",
};

export default function InvoicesPage() {
  return (
    <ProtectedRoute requiredRole="vendor">
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="mt-1 text-gray-500">Submit and manage invoices against your fund allocations.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <SubmitInvoiceForm />
            <InvoiceInfo />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function SubmitInvoiceForm() {
  const { data: hash, writeContract, isPending } = useWriteContract();
  const [allocationId, setAllocationId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceHash, setInvoiceHash] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
  const [description, setDescription] = useState("");
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
      const aId = validateRequired(allocationId, "Allocation ID");
      const vName = validateRequired(vendorName, "Vendor name");
      const amt = BigInt(Math.round(parseFloat(amount) * 100));
      const iHash = validateRequired(invoiceHash, "Invoice hash");
      const cid = validateRequired(ipfsCid, "IPFS CID");
      const desc = validateRequired(description, "Description");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CHAIN_LOGGER_ABI,
        functionName: "submitInvoice",
        args: [BigInt(aId), vName, amt, iHash, cid, desc],
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
          <h3 className="text-lg font-semibold text-gray-900">Invoice Submitted</h3>
          <p className="mt-2 text-sm text-gray-500">Transaction confirmed on Polygon.</p>
          <p className="mt-1 text-xs text-gray-400 font-mono break-all">TX: {hash}</p>
          <Button variant="ghost" className="mt-4" onClick={() => {
            setAllocationId(""); setVendorName(""); setAmount(""); setInvoiceHash(""); setIpfsCid(""); setDescription(""); setSubmitted(false);
          }}>Submit Another</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Submit Invoice</h3>
      <p className="mt-1 text-sm text-gray-500">Bill against an allocation with SHA-256 hash verification.</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Allocation ID" type="number" value={allocationId} onChange={(e) => setAllocationId(e.target.value)} required />
          <Input label="Vendor Name" value={vendorName} onChange={(e) => setVendorName(e.target.value)} required />
        </div>
        <Input label="Amount (USD)" type="number" step="0.01" placeholder="2500.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <Input label="Invoice SHA-256 Hash" value={invoiceHash} onChange={(e) => setInvoiceHash(e.target.value)} placeholder="64-character hex hash" required />
        <Input label="IPFS CID" value={ipfsCid} onChange={(e) => setIpfsCid(e.target.value)} required />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isPending}>{isPending ? "Submitting..." : "Submit Invoice"}</Button>
      </form>
    </Card>
  );
}

function InvoiceInfo() {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Invoice Requirements</h3>
      <div className="mt-4 space-y-4 text-sm text-gray-600">
        <p>Each invoice must include:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>A valid allocation ID (find in Finance → Allocations)</li>
          <li>SHA-256 hash of the invoice document (64 hex chars)</li>
          <li>IPFS CID of the uploaded invoice document</li>
          <li>Clear description of services/goods provided</li>
        </ul>
        <p className="text-xs text-gray-400">Invoices are reviewed by finance before approval and payment.</p>
      </div>
    </Card>
  );
}
