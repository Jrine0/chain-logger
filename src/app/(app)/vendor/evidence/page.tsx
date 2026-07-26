"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { validateRequired } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Card, Button, Input } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/protected-route";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

export default function EvidencePage() {
  return (
    <ProtectedRoute requiredRole="vendor">
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Evidence</h1>
            <p className="mt-1 text-gray-500">Upload execution evidence to verify project deliverables.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <UploadEvidenceForm />
            <EvidenceInfo />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function UploadEvidenceForm() {
  const { data: hash, writeContract, isPending } = useWriteContract();
  const [invoiceId, setInvoiceId] = useState("");
  const [evidenceHash, setEvidenceHash] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const iId = invoiceId === "" ? "0" : validateRequired(invoiceId, "Invoice ID");
      const eHash = validateRequired(evidenceHash, "Evidence hash");
      const cid = validateRequired(ipfsCid, "IPFS CID");
      const fName = validateRequired(fileName, "File name");
      const fType = validateRequired(fileType, "File type");
      const fSize = BigInt(parseInt(fileSize, 10));

      if (!CONTRACT_ADDRESS) { setError("Contract address not configured."); return; }
      const addr = CONTRACT_ADDRESS!;
      writeContract({
        address: addr,
        abi: CHAIN_LOGGER_ABI,
        functionName: "uploadEvidence",
        args: [BigInt(iId), eHash, cid, fName, fType, fSize],
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
          <p className="mt-2 text-sm text-gray-500">Transaction confirmed on Polygon.</p>
          <p className="mt-1 text-xs text-gray-400 font-mono break-all">TX: {hash}</p>
          <Button variant="ghost" className="mt-4" onClick={() => {
            setInvoiceId(""); setEvidenceHash(""); setIpfsCid(""); setFileName(""); setFileType(""); setFileSize(""); setSubmitted(false);
          }}>Upload More</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Upload Evidence</h3>
      <p className="mt-1 text-sm text-gray-500">Link execution evidence to an invoice or project.</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Input label="Invoice ID (optional, 0 for project-level)" type="number" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} placeholder="0" />
        <Input label="Evidence SHA-256 Hash" value={evidenceHash} onChange={(e) => setEvidenceHash(e.target.value)} placeholder="64-character hex hash" required />
        <Input label="IPFS CID" value={ipfsCid} onChange={(e) => setIpfsCid(e.target.value)} required />
        <Input label="File Name" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="photo_001.jpg" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="File Type" value={fileType} onChange={(e) => setFileType(e.target.value)} placeholder="image/jpeg" required />
          <Input label="File Size (bytes)" type="number" value={fileSize} onChange={(e) => setFileSize(e.target.value)} placeholder="524288" required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isPending}>{isPending ? "Uploading..." : "Upload Evidence"}</Button>
      </form>
    </Card>
  );
}

function EvidenceInfo() {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Evidence Guidelines</h3>
      <div className="mt-4 space-y-4 text-sm text-gray-600">
        <p>Evidence files prove project deliverables. Each upload needs:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>SHA-256 hash of the original file</li>
          <li>IPFS CID of the uploaded file</li>
          <li>Original filename and MIME type</li>
          <li>File size in bytes</li>
        </ul>
        <p className="text-xs text-gray-400">Leave Invoice ID empty (0) for general project-level evidence.</p>
      </div>
    </Card>
  );
}
