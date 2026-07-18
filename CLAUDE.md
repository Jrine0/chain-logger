# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Next.js frontend
- `npm run dev` — start dev server (port 3000)
- `npm run build` — production build (clean, no warnings)
- `npm run lint` — ESLint
- `npm run start` — serve production build

### Foundry (Solidity)
- `forge build` — compile contract
- `forge test` — run tests
- `forge test -vvv` — verbose test output
- `forge test --rerun` — retry only failed tests
- `forge test <pattern>` — run a single test by name, e.g. `forge test --match-test test_FinanceCanRecordReceipt`
- `forge test --match-path test/ChainLogger.t.sol -vvv` — single file
- `forge script script/Deploy.s.sol:Deploy --rpc-url <url> --private-key <key> --broadcast` — deploy
- `forge test --gas-report` — gas profiling

### CI/CD
- GitHub Actions runs 3 jobs: lint+build (Node), test (Foundry), deploy (Foundry)
- Deploy requires secrets: `PRIVATE_KEY`, `POLYGON_AMOY_RPC_URL`, `POLYGONSCAN_API_KEY`

## Architecture

### Dual-stack: Web3 frontend + Solidity smart contract

**`contracts/ChainLogger.sol`** — Solidity 0.8.28 contract for nonprofit fund transparency, deployed on Polygon.
- Uses OpenZeppelin v5 (AccessControl, Pausable)
- Roles: ADMIN_ROLE, FINANCE_ROLE, VENDOR_ROLE, VIEWER_ROLE
- Data model (all stored in mapping arrays for gas efficiency):
  - Receipts: bank deposits → donors
  - Projects: program/initiative metadata with IPFS CID
  - Allocations: fund transfers from receipts to projects
  - Invoices: vendor billing with SHA-256 hash + IPFS CID
  - Evidences: supporting files with SHA-256 hash + IPFS CID
- Flow: Finance records receipts → creates projects → allocates funds → vendors submit invoices → finance approves/rejects → vendors upload evidence → finance verifies
- Values stored in cents (uint256) to avoid floating point
- Uses `via_ir = true` and `optimizer_runs = 200`
- O(1) allocation tracking via `_receiptAllocatedTotals` mapping
- Events emitted for all state changes (ProjectStatusUpdated, EvidenceStatusUpdated, etc.)

**`src/`** — Next.js 15 (App Router) transparency dashboard.
- `app/layout.tsx`: root layout with WalletProvider
- `app/providers.tsx`: injects wagmi QueryClient and WalletProvider
- Pages are role-gated (finance, vendor, public dashboard)
- `config/wagmi.ts`: wagmi config with injected + WalletConnect connectors, complete ABI with all events
- `hooks/use-contract-formatters.ts`: data formatting for contract display
- `hooks/use-ipfs.ts`: IPFS gateway + Pinata upload helpers
- All write forms have client-side validation, error display, and post-submission confirmation state

### Key design decisions
- `lib/` in Foundry is committed (pinned dep versions) — do not add to .gitignore
- Next.js `next.config.js` uses webpack aliases to stub broken transitive `@x402/*` deps from `@coinbase/cdp-sdk` (pulled in via wagmi)
- `.env.example` lists all required env vars including `NEXT_PUBLIC_PINATA_JWT`
- Role management is consistent: ADMIN manages FINANCE, VENDOR, VIEWER roles

## Setup

```bash
npm install                    # frontend deps
forge install OpenZeppelin/openzeppelin-contracts   # smart contract deps
forge install foundry-rs/forge-std                  # test framework
forge build                    # compile contract
```

Environment: create `.env.local` with wallet config and `NEXT_PUBLIC_CONTRACT_ADDRESS`.
