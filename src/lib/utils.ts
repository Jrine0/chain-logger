import type { Address } from "viem";

/**
 * Helper: convert USD dollars to cents (uint256)
 */
export function usdToCents(usd: number): bigint {
  return BigInt(Math.round(usd * 100));
}

/**
 * Helper: convert cents back to USD for display
 */
export function centsToUsd(cents: bigint | number | string): number {
  const c = typeof cents === "bigint" ? Number(cents) : typeof cents === "number" ? cents : parseInt(cents, 10);
  return c / 100;
}

/**
 * Helper: format a USD amount (in cents) for display
 */
export function formatUsd(cents: bigint | number | string): string {
  const dollars = centsToUsd(cents);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Helper: format a wallet address for display
 */
export function truncateAddress(addr: Address | `0x${string}` | string): string {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * Helper: format a unix timestamp (seconds) for display
 */
export function formatDate(unix: bigint | number | string): string {
  let ts: number;
  if (typeof unix === "bigint") ts = Number(unix);
  else if (typeof unix === "number") ts = unix;
  else ts = parseInt(unix, 10);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ts * 1000));
}

/**
 * Helper: format a file size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Helper: build an IPFS gateway URL from a CID
 */
export function ipfsUrl(cid: string, gateway?: string): string {
  const gw = gateway || process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
  return `${gw}${cid}`;
}

/**
 * Helper: validate a positive number string
 */
export function validatePositiveNumber(value: string, fieldName: string): number {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return num;
}

/**
 * Helper: validate a required string is not empty
 */
export function validateRequired(value: string, fieldName: string): string {
  if (!value || value.trim() === "") {
    throw new Error(`${fieldName} is required`);
  }
  return value.trim();
}

/**
 * Helper: validate SHA-256 hash (64 hex chars)
 */
export function validateSha256(value: string): string {
  const trimmed = value.trim();
  if (!/^[a-fA-F0-9]{64}$/.test(trimmed)) {
    throw new Error("SHA-256 hash must be exactly 64 hexadecimal characters");
  }
  return trimmed;
}

/**
 * Helper: safely convert string to BigInt
 */
export function safeBigInt(value: string, fieldName: string): bigint {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new Error(`${fieldName} is required`);
  }
  try {
    const result = BigInt(trimmed);
    if (result < 0n) {
      throw new Error(`${fieldName} must be non-negative`);
    }
    return result;
  } catch (e) {
    throw new Error(`${fieldName} must be a valid number`);
  }
}

/**
 * Helper: class name merger
 */
export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
