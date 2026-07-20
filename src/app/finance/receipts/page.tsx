"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { useAccount, useReadContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { formatCurrency } from "@/hooks/use-contract-formatters";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;
const PAGE_SIZE = 10;

// Fetch a single receipt row.
function ReceiptRow({ id }: { id: number }) {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getReceipt",
    args: [BigInt(id)],
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  if (!data) return null;
  const [id_, , amount, donorName, bankReference, createdAt, status, exists] = data;
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
          Number(status) === 0 ? "bg-blue-100 text-blue-700"
          : Number(status) === 1 ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
        }`}>
          {Number(status) === 0 ? "Recorded" : Number(status) === 1 ? "Allocated" : "Refunded"}
        </span>
      </td>
    </tr>
  );
}

// Pagination controls rendered at the bottom of the table.
function Pagination({
  count,
  page,
  setPage,
}: {
  count: number;
  page: number;
  setPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <span className="text-sm text-gray-500">
        Page {page + 1} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-40 hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage(page + 1)}
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-40 hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function ReceiptsPage() {
  const { data: total } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalReceipts",
    query: { enabled: !!CONTRACT_ADDRESS, staleTime: 30_000 },
  });

  const count = total ? Number(total) : 0;
  // Always paginate — the table only renders PAGE_SIZE rows per page.
  const pageSize = count > 0 ? Math.min(PAGE_SIZE, count) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Receipts</h1>
          <p className="mt-1 text-gray-500">
            {count} receipt{count !== 1 ? "s" : ""} on-chain.
          </p>
        </div>

        <ReceiptTable count={count} pageSize={pageSize} />
      </div>
    </div>
  );
}

function ReceiptTable({ count, pageSize }: { count: number; pageSize: number }) {
  const [page, setPage] = useState(0);
  // Reset to page 0 when the total count changes (e.g. new receipt arrives).
  useEffect(() => { setPage(0); }, [count]);

  const start = Math.max(0, count - 1 - page * PAGE_SIZE);
  const ids = Array.from({ length: pageSize }, (_, i) => start - i);

  return (
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
            </tr>
          </thead>
          <tbody>
            {count === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No receipts recorded yet.
                </td>
              </tr>
            ) : (
              ids.map((idx) => <ReceiptRow key={idx} id={idx} />)
            )}
          </tbody>
        </table>
      </div>
      <Pagination count={count} page={page} setPage={setPage} />
    </div>
  );
}
