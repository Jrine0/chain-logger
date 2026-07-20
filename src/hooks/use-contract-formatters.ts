"use client";

import { format } from "date-fns";
import { formatDate as _formatDate, truncateAddress as _truncateAddress } from "@/lib/utils";

// ─── Status Labels ──────────────────────────────────────────────
export const RECEIPT_STATUS_LABELS = ["Recorded", "Allocated", "Refunded"] as const;
export const PROJECT_STATUS_LABELS = ["Active", "Completed", "Cancelled"] as const;
export const INVOICE_STATUS_LABELS = ["Submitted", "Under Review", "Approved", "Rejected", "Paid"] as const;
export const EVIDENCE_STATUS_LABELS = ["Uploaded", "Verified", "Rejected"] as const;

// ─── Formatters ─────────────────────────────────────────────────
export function formatBlockTime(unix: number | bigint | string): string {
  let ts: number;
  if (typeof unix === "bigint") ts = Number(unix) * 1000;
  else if (typeof unix === "number") ts = unix * 1000;
  else ts = parseInt(unix, 10) * 1000;
  if (ts === 0) return "—";
  return format(new Date(ts), "PP p");
}

export function formatCurrency(cents: bigint | number | string): string {
  const c = typeof cents === "bigint" ? Number(cents) : typeof cents === "number" ? cents : parseFloat(cents);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(c / 100);
}

export { _truncateAddress as truncateAddress, _formatDate as formatDate };
