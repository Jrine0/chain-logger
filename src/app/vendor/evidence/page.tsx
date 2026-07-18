"use client";

import { Navbar } from "@/components/navbar";
import { Card, Button, Input } from "@/components/ui";
import { useAccount, useWriteContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { validateSha256, safeBigInt, validateRequired } from "@/lib/utils";
import { useState } from "react";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

function UploadEvidenceForm() {
  const { isConnected } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const [invoiceId, setInvoiceId] = useState("");
  const [evidenceHash, setEvidenceHash] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileSize, setFileSize] = useState("");
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
      const invId = invoiceId.trim() === "" ? BigInt(0) : safeBigInt(invoiceId, "Invoice ID");
      const hash64 = validateSha256(evidenceHash);
      const cid = validateRequired(ipfsCid, "IPFS CID");
      const fname = validateRequired(fileName, "File name");
      const ftype = validateRequired(fileType, "File type");
      const fsize = parseInt(fileSize, 10);
      if (isNaN(fsize) || fsize <= 0) {
        throw new Error("File size must be a positive number");
      }

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CHAIN_LOGGER_ABI,
        functionName: "uploadEvidence",
        args: [invId, hash64, cid, fname, ftype, BigInt(fsize)],
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
          <h3 className="text-lg font-semibold text-gray-900">Evidence Uploaded</h3>
          <p className="mt-2 text-sm text-gray-500">Transaction confirmed on Polygon. Awaiting finance verification.</p>
          <p className="mt-1 text-xs text-gray-400 font-mono break-all">TX: {hash}</p>
          <Button variant="ghost" className="mt-4" onClick={() => {
            setInvoiceId("");
            setEvidenceHash("");
            setIpfsCid("");
            setFileName("");
            setFileType("");
            setFileSize("");
            setSubmitted(false);
          }}>Upload More Evidence</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Upload Evidence</h3>
      <p className="mt-1 text-sm text-gray-500">
        Attach invoices, receipt photos, impact reports, or any execution evidence. SHA-256 hash the file locally before submitting.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Input label="Invoice ID (0 for project-level)" type="number" value={invoiceId} onChange={(e) => { setInvoiceId(e.target.value); setError(null); }} />
        <Input label="SHA-256 Hash (64 hex chars)" value={evidenceHash} onChange={(e) => { setEvidenceHash(e.target.value); setError(null); }} required />
        <Input label="IPFS CID" value={ipfsCid} onChange={(e) => { setIpfsCid(e.target.value); setError(null); }} required />
        <Input label="File Name" value={fileName} onChange={(e) => { setFileName(e.target.value); setError(null); }} required />
        <Input label="File Type (MIME)" placeholder="image/jpeg, application/pdf" value={fileType} onChange={(e) => { setFileType(e.target.value); setError(null); }} required />
        <Input label="File Size (bytes)" type="number" value={fileSize} onChange={(e) => { setFileSize(e.target.value); setError(null); }} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isPending}>{isPending ? "Uploading..." : "Upload Evidence"}</Button>
        {hash && <p className="text-xs text-gray-500">TX: {hash}</p>}
      </form>
    </Card>
  );
}

export default function VendorEvidencePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vendor Portal — Evidence Upload</h1>
          <p className="mt-1 text-gray-500">Upload invoices and execution evidence with cryptographic proof.</p>
        </div>
        <div className="max-w-2xl">
          <UploadEvidenceForm />
        </div>
      </div>
    </div>
  );
}
