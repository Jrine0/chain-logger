"use client";

import { Navbar } from "@/components/navbar";
import { Card, Button, Input } from "@/components/ui";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { usdToCents, validatePositiveNumber, safeBigInt, validateSha256, validateRequired } from "@/lib/utils";
import { useState } from "react";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

function SubmitInvoiceForm() {
  const { isConnected } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const [allocationId, setAllocationId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceHash, setInvoiceHash] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isConnected) {
    return <Card><p className="text-gray-500">Connect your wallet as a Vendor.</p></Card>;
  }

  if (!CONTRACT_ADDRESS) {
    return <Card><p className="text-red-600">Contract address not configured.</p></Card>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const allocId = safeBigInt(allocationId, "Allocation ID");
      const name = validateRequired(vendorName, "Vendor name");
      const usd = validatePositiveNumber(amount, "Amount");
      const hash64 = validateSha256(invoiceHash);
      const cid = validateRequired(ipfsCid, "IPFS CID");
      const desc = validateRequired(description, "Description");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CHAIN_LOGGER_ABI,
        functionName: "submitInvoice",
        args: [allocId, name, usdToCents(usd), hash64, cid, desc],
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
          <p className="mt-2 text-sm text-gray-500">Awaiting finance team approval.</p>
          <p className="mt-1 text-xs text-gray-400 font-mono break-all">TX: {hash}</p>
          <Button variant="ghost" className="mt-4" onClick={() => {
            setAllocationId("");
            setVendorName("");
            setAmount("");
            setInvoiceHash("");
            setIpfsCid("");
            setDescription("");
            setSubmitted(false);
          }}>Submit Another Invoice</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Submit Invoice</h3>
      <p className="mt-1 text-sm text-gray-500">
        Submit a new invoice against your fund allocation. Includes SHA-256 hash and IPFS document.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Input label="Allocation ID" type="number" value={allocationId} onChange={(e) => { setAllocationId(e.target.value); setError(null); }} required />
        <Input label="Vendor / Organization Name" value={vendorName} onChange={(e) => { setVendorName(e.target.value); setError(null); }} required />
        <Input label="Amount (USD)" type="number" step="0.01" placeholder="1200.00" value={amount} onChange={(e) => { setAmount(e.target.value); setError(null); }} required />
        <Input label="SHA-256 Invoice Hash (64 hex chars)" value={invoiceHash} onChange={(e) => { setInvoiceHash(e.target.value); setError(null); }} required />
        <Input label="Invoice IPFS CID" value={ipfsCid} onChange={(e) => { setIpfsCid(e.target.value); setError(null); }} required />
        <Input label="Description" value={description} onChange={(e) => { setDescription(e.target.value); setError(null); }} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isPending}>{isPending ? "Submitting..." : "Submit Invoice"}</Button>
        {hash && <p className="text-xs text-gray-500">TX: {hash}</p>}
      </form>
    </Card>
  );
}

export default function VendorInvoicesPage() {
  const { data: total } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalInvoices",
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vendor Portal — Invoices</h1>
          <p className="mt-1 text-gray-500">Submit invoices against your fund allocation. {total ? `${Number(total)} on-chain.` : ""}</p>
        </div>
        <div className="max-w-2xl">
          <SubmitInvoiceForm />
        </div>
      </div>
    </div>
  );
}
