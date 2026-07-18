import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { base, polygonAmoy } from "wagmi/chains";

/**
 * ChainLogger wagmi/viem configuration
 *
 * Deployed contract address should be set after deployment.
 * Currently targets Polygon Amoy (testnet) for development.
 */
export const config = createConfig({
  chains: [base, polygonAmoy],
  connectors: [
    injected(),  // MetaMask, Coinbase Wallet extension, Rabby, etc.
    ...(process.env.NEXT_PUBLIC_WALLETCONNECT_ID
      ? [walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID })]
      : []),
  ],
  transports: {
    [base.id]: http(),
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology"),
  },
});

/**
 * ChainLogger contract ABI
 * Include all functions that the frontend needs to call or listen for events.
 */
export const CHAIN_LOGGER_ABI = [
  // ─── Receipts ───────────────────────────────────────────────────
  {
    type: "function",
    name: "recordReceipt",
    inputs: [
      { name: "donorName", type: "string" },
      { name: "amountUSD", type: "uint256" },
      { name: "bankReference", type: "string" },
      { name: "bankTxHash", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getReceipt",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "donor", type: "address" },
      { name: "amountUSD", type: "uint256" },
      { name: "donorName", type: "string" },
      { name: "bankReference", type: "string" },
      { name: "bankTxHash", type: "string" },
      { name: "createdAt", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "exists", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalReceipts",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  // ─── Projects ───────────────────────────────────────────────────
  {
    type: "function",
    name: "createProject",
    inputs: [
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "ipfsCid", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getProject",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "ipfsCid", type: "string" },
      { name: "manager", type: "address" },
      { name: "totalAllocated", type: "uint256" },
      { name: "totalSpent", type: "uint256" },
      { name: "createdAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "exists", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalProjects",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProjectAllocations",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  // ─── Allocations ────────────────────────────────────────────────
  {
    type: "function",
    name: "allocateFunds",
    inputs: [
      { name: "receiptId", type: "uint256" },
      { name: "projectId", type: "uint256" },
      { name: "amountUSD", type: "uint256" },
      { name: "purpose", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAllocation",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "receiptId", type: "uint256" },
      { name: "projectId", type: "uint256" },
      { name: "amountUSD", type: "uint256" },
      { name: "purpose", type: "string" },
      { name: "createdAt", type: "uint256" },
      { name: "exists", type: "bool" },
    ],
    stateMutability: "view",
  },
  // ─── Invoices ───────────────────────────────────────────────────
  {
    type: "function",
    name: "submitInvoice",
    inputs: [
      { name: "allocationId", type: "uint256" },
      { name: "vendorName", type: "string" },
      { name: "amountUSD", type: "uint256" },
      { name: "invoiceHash", type: "string" },
      { name: "ipfsCid", type: "string" },
      { name: "description", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approveInvoice",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "rejectInvoice",
    inputs: [
      { name: "", type: "uint256" },
      { name: "reason", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getInvoice",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "allocationId", type: "uint256" },
      { name: "vendor", type: "address" },
      { name: "vendorName", type: "string" },
      { name: "amountUSD", type: "uint256" },
      { name: "invoiceHash", type: "string" },
      { name: "ipfsCid", type: "string" },
      { name: "description", type: "string" },
      { name: "submittedAt", type: "uint256" },
      { name: "reviewedAt", type: "uint256" },
      { name: "reviewedBy", type: "address" },
      { name: "status", type: "uint8" },
      { name: "rejectionReason", type: "string" },
      { name: "exists", type: "bool" },
    ],
    stateMutability: "view",
  },
  // ─── Evidence ───────────────────────────────────────────────────
  {
    type: "function",
    name: "uploadEvidence",
    inputs: [
      { name: "invoiceId", type: "uint256" },
      { name: "evidenceHash", type: "string" },
      { name: "ipfsCid", type: "string" },
      { name: "fileName", type: "string" },
      { name: "fileType", type: "string" },
      { name: "fileSizeBytes", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "verifyEvidence",
    inputs: [
      { name: "", type: "uint256" },
      { name: "note", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getEvidence",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "invoiceId", type: "uint256" },
      { name: "uploadedBy", type: "address" },
      { name: "evidenceHash", type: "string" },
      { name: "ipfsCid", type: "string" },
      { name: "fileName", type: "string" },
      { name: "fileType", type: "string" },
      { name: "fileSizeBytes", type: "uint256" },
      { name: "uploadedAt", type: "uint256" },
      { name: "verifiedAt", type: "uint256" },
      { name: "verifiedBy", type: "address" },
      { name: "status", type: "uint8" },
      { name: "verificationNote", type: "string" },
      { name: "exists", type: "bool" },
    ],
    stateMutability: "view",
  },
  // ─── Events (for React Query subscription) ──────────────────────
  {
    type: "event",
    name: "ReceiptRecorded",
    inputs: [
      { name: "receiptId", type: "uint256", indexed: true },
      { name: "donor", type: "address", indexed: true },
      { name: "amountUSD", type: "uint256", indexed: false },
      { name: "bankReference", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ProjectCreated",
    inputs: [
      { name: "projectId", type: "uint256", indexed: true },
      { name: "manager", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "FundAllocated",
    inputs: [
      { name: "allocationId", type: "uint256", indexed: true },
      { name: "receiptId", type: "uint256", indexed: true },
      { name: "projectId", type: "uint256", indexed: true },
      { name: "amountUSD", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "InvoiceSubmitted",
    inputs: [
      { name: "invoiceId", type: "uint256", indexed: true },
      { name: "allocationId", type: "uint256", indexed: true },
      { name: "vendor", type: "address", indexed: true },
      { name: "amountUSD", type: "uint256", indexed: false },
      { name: "invoiceHash", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "InvoiceStatusUpdated",
    inputs: [
      { name: "invoiceId", type: "uint256", indexed: true },
      { name: "status", type: "uint8", indexed: false },
      { name: "updatedBy", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "EvidenceUploaded",
    inputs: [
      { name: "evidenceId", type: "uint256", indexed: true },
      { name: "invoiceId", type: "uint256", indexed: true },
      { name: "uploader", type: "address", indexed: true },
      { name: "evidenceHash", type: "string", indexed: false },
      { name: "ipfsCid", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EvidenceStatusUpdated",
    inputs: [
      { name: "evidenceId", type: "uint256", indexed: true },
      { name: "status", type: "uint8", indexed: false },
      { name: "updatedBy", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "ProjectStatusUpdated",
    inputs: [
      { name: "projectId", type: "uint256", indexed: true },
      { name: "status", type: "uint8", indexed: false },
      { name: "updatedBy", type: "address", indexed: true },
    ],
  },
  // ─── Counters ──────────────────────────────────────────────────
  {
    type: "function",
    name: "getTotalInvoices",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalEvidences",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalAllocations",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getReceiptAllocations",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProjectAllocations",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProjectInvoices",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "markInvoicePaid",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "rejectEvidence",
    inputs: [
      { name: "", type: "uint256" },
      { name: "reason", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
