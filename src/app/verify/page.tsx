"use client";

import { useState } from "react";
import { Card, Input, Badge, Button, SectionTitle } from "@/components/ui";
import { useAccount } from "wagmi";

type VerifyType = "invoice" | "evidence";

const statusLabels: Record<number, string> = { 0: "Pending", 1: "Approved", 2: "Rejected" };
const statusColors: Record<number, "info" | "success" | "danger"> = { 0: "info", 1: "success", 2: "danger" };

export default function VerifyPage() {
  const { isConnected } = useAccount();
  const [type, setType] = useState<VerifyType>("invoice");
  const [id, setId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // TODO: Wire to contract reads — use useReadContract with getInvoice / getEvidence

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId < 0) {
      setError("Please enter a valid ID number.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResult({
        id: numId,
        status: 0,
        message: "Live contract verification not yet connected.",
      });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="gradient-hero text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Public Verification</h1>
          <p className="mt-2 text-white/70">
            Verify invoices and evidence on Polygon. No wallet required.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {!isConnected && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Verification is public — no wallet connection needed. Connect your wallet only if you want to interact with the contract.
          </div>
        )}

        <Card>
          <SectionTitle title="Verify Record" description="Look up any invoice or evidence record on-chain." />

          {/* Type selector */}
          <div className="mt-5 flex items-center gap-1 rounded-xl bg-gray-100 p-1 w-fit">
            {(["invoice", "evidence"] as VerifyType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setResult(null); setError(null); }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all capitalize ${
                  type === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <form onSubmit={handleVerify} className="mt-5 space-y-4">
            <Input
              label={`${type === "invoice" ? "Invoice" : "Evidence"} ID`}
              type="number"
              placeholder="0"
              value={id}
              onChange={(e) => { setId(e.target.value); setError(null); setResult(null); }}
              required
            />
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Verifying..." : "Verify on-Chain"}
            </Button>
          </form>

          {result && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Record</p>
                  <p className="font-mono text-sm font-medium">#{result.id}</p>
                </div>
                <Badge variant={statusColors[result.status]}>
                  {statusLabels[result.status]}
                </Badge>
              </div>
              <p className="mt-4 text-sm text-gray-500">{result.message}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
