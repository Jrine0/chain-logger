# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Next.js frontend
- `npm run dev` — start dev server (port 3000)
- `npm run dev:turbo` — dev server with Turbopack
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
- Deploy to Polygon Amoy only on main branch push
- Deploy requires repo secrets: `PRIVATE_KEY`, `POLYGON_AMOY_RPC_URL`, `POLYGONSCAN_API_KEY`
- Test job runs `forge test -vvv` on every PR/push

## Architecture

### Dual-stack: Web3 frontend + Solidity smart contract

**`contracts/ChainLogger.sol`** — Solidity 0.8.28 contract for transparent fund tracking, deployed on Polygon.
- Uses OpenZeppelin v5 (AccessControl, Pausable, ReentrancyGuard)
- Roles: ADMIN_ROLE, FINANCE_ROLE, VENDOR_ROLE, VIEWER_ROLE
- Data model (mapping arrays for gas-efficient iteration): Receipt, Project, Allocation, Invoice, Evidence, Organization
- Flow: Finance records receipts → creates projects → allocates funds → vendors submit invoices → finance approves/rejects → vendors upload evidence → finance verifies
- Values stored in cents (uint256), custom Error types (not require strings) for gas savings
- Uses `via_ir = true` and `optimizer_runs = 200`
- O(1) allocation tracking via `_receiptAllocatedTotals` mapping; per-project and per-vendor invoice indexes
- Events emitted for all state changes

**`src/`** — Next.js 15 (App Router) transparency dashboard.
- Uses route groups: `(auth)` for login/register, `(app)` for authenticated pages
- `middleware.ts`: Supabase auth session refresh + route guard (public `/` and `/verify`; auth redirects `/login`, `/register`; app routes require session)
- `contexts/SupabaseAuthContext.tsx`: **current** auth — Supabase email/password + org membership with roles (admin/finance/vendor/viewer)
- `contexts/AuthContext.tsx`: **legacy** wallet-based auth — reads contract roles on-chain; being phased out
- `config/wagmi.ts`: wagmi v2 config with injected + WalletConnect connectors, complete contract ABI
- `hooks/use-contract-formatters.ts`: data formatting (cents→USD, address truncation, date formatting)
- `hooks/use-ipfs.ts`: IPFS gateway + Pinata upload helpers
- `lib/utils.ts`: shared validation (SHA-256, positive numbers, required strings), format helpers, classname merger
- Tailwind uses a `brand-*` color palette (brand-50 through brand-700) and `maroon` accent
- All write forms have client-side validation, error display, and post-submission confirmation state

### Supabase schema (`supabase/schema.sql`)
- Tables: `organizations`, `members` (with enum role), `profiles` (extends auth.users)
- Row Level Security: admins manage orgs/members, members read their org, users manage own profile
- Auto-creates profile on signup via trigger
- Storage bucket `org-logos` for org avatar uploads

### Key design decisions
- `lib/` in Foundry is committed (pinned dep versions) — do not add to .gitignore
- `src/lib/empty-module.js` is a required stub: `next.config.js` uses webpack aliases to resolve broken transitive `@x402/*` deps and `pino-pretty` pulled in via wagmi/`@coinbase/cdp-sdk`
- `.env.example` lists all required env vars including `NEXT_PUBLIC_PINATA_JWT` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- The project is **mid-migration** from on-chain role auth to Supabase auth — both contexts coexist; prefer SupabaseAuthContext for new pages

## Setup

```bash
npm install                              # frontend deps
forge install OpenZeppelin/openzeppelin-contracts   # smart contract deps
forge install foundry-rs/forge-std                  # test framework
forge build                              # compile contract
```

Environment: `.env.local` for Next.js frontend vars, `.env` for Foundry deploy vars. Both are gitignored. See `.env.example` for the full list with descriptions.
