"use client";

import { Navbar } from "@/components/navbar";
import { useReadContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { formatCurrency } from "@/hooks/use-contract-formatters";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

const POLYGONSCAN_BASE = "https://amoy.polygonscan.com/tx/";

function ReceiptRow({ id }: { id: number }) {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getReceipt",
    args: [BigInt(id)],
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  if (!data) return null;

  const [id_, donor, amount, donorName, bankReference, bankTxHash, createdAt, status, exists] = data;

  if (!exists) return null;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 font-mono text-sm">#{id_.toString()}</td>
      <td className="px-4 py-3 text-sm">{donorName}</td>
      <td className="px-4 py-3 text-sm font-medium">{formatCurrency(amount)}</td>
      <td className="px-4 py-3 text-sm">{bankReference}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(createdAt)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          status === 0 ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
        }`}>
          {status === 0 ? "Recorded" : status === 1 ? "Allocated" : "Refunded"}
        </span>
      </td>
      <td className="px-4 py-3">
        {bankTxHash && bankTxHash !== "0x" ? (
          <Link href={`${POLYGONSCAN_BASE}${bankTxHash}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
            {bankTxHash.slice(0, 16)}...
          </Link>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}

export default function ReceiptsPage() {
  const { data: total } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalReceipts",
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  const count = total ? Number(total) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Receipts</h1>
          <p className="mt-1 text-gray-500">{count} receipt{count !== 1 ? "s" : ""} on-chain.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">ID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Donor</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Reference</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Bank TX</th>
                </tr>
              </thead>
              <tbody>
                {count === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No receipts recorded yet.</td></tr>
                ) : (
                  Array.from({ length: count }, (_, i) => <ReceiptRow key={i} id={i} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
