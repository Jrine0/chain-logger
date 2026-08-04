# ChainLogger — User & Developer Guide

A practical walkthrough for using, configuring, and deploying ChainLogger.

---

## Table of contents
1. [Quick start](#1-quick-start)
2. [Environment configuration](#2-environment-configuration)
3. [Smart contract — build, test, deploy](#3-smart-contract--build-test-deploy)
4. [Supabase setup](#4-supabase-setup)
5. [Roles & authentication](#5-roles--authentication)
6. [Roles in the app](#6-roles-in-the-app)
7. [The on-chain flow](#7-the-on-chain-flow)
8. [Frontend — running & developing](#8-frontend--running--developing)
9. [Admin operations](#9-admin-operations)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Quick start

```bash
git clone <repo>
cd chain-logger

npm install
forge install
forge build

# Set up two env files (see Environment Configuration below)
cp .env.example .env       # Foundry deploy vars
cp .env.example .env.local # Next.js frontend vars

npm run dev                # frontend at http://localhost:3000
```

---

## 2. Environment configuration

ChainLogger uses two environment files because Next.js and Foundry have different conventions.

### `.env.local` — Next.js frontend vars
Browser-exposed via `NEXT_PUBLIC_*` prefix. Gitignored.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed ChainLogger on Polygon (Amoy for testing) |
| `NEXT_PUBLIC_WALLETCONNECT_ID` | WalletConnect Project ID (cloud.walletconnect.com) |
| `NEXT_PUBLIC_ALCHEMY_POLYGON_RPC` | Alchemy RPC URL for read calls |
| `NEXT_PUBLIC_PINATA_JWT` | Pinata API key for IPFS uploads |
| `NEXT_PUBLIC_IPFS_GATEWAY` | IPFS gateway URL (default: Pinata) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase **anon** key (not service_role) |

### `.env` — Foundry deploy vars
Server-side only. Gitignored.

| Variable | Purpose |
|---|---|
| `PRIVATE_KEY` | Deployer wallet private key (use a fresh dev wallet) |
| `POLYGON_AMOY_RPC_URL` | RPC for testnet deploys |
| `POLYGON_MAINNET_RPC_URL` | RPC for mainnet deploys |
| `POLYGONSCAN_API_KEY` | For Etherscan verification (polygonscan.com/apis) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin scripts (NEVER expose to browser) |

---

## 3. Smart contract — build, test, deploy

### Build
```bash
forge build
```

### Run tests
```bash
forge test                        # all tests
forge test -vvv                   # verbose
forge test --match-test test_AllocateFunds  # single test
forge test --gas-report           # gas profiling
```

### Deploy to Amoy (testnet)
```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$POLYGON_AMOY_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --verify \
  --etherscan-api-key "$POLYGONSCAN_API_KEY" \
  -vvvv
```

The deploy script deploys `ChainLogger` with the deployer as ADMIN. The output prints the contract address — paste it into `.env.local` as `NEXT_PUBLIC_CONTRACT_ADDRESS`.

### Manual deploy (Windows shell, env vars don't always propagate)
```bash
set -a && source .env && set +a
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "%POLYGON_AMOY_RPC_URL%" \
  --private-key "%PRIVATE_KEY%" \
  --broadcast --verify --etherscan-api-key "%POLYGONSCAN_API_KEY%"
```

---

## 4. Supabase setup

### One-time
1. Create a project at supabase.com/dashboard
2. Settings → API → copy `Project URL` (→ `NEXT_PUBLIC_SUPABASE_URL`) and `anon public` key (→ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
3. SQL Editor → New query → paste contents of `supabase/schema.sql` → Run

This creates:
- `organizations`, `members`, `profiles` tables
- `member_role` enum: `admin`, `finance`, `vendor`, `viewer`
- Row Level Security policies
- Auto-profile trigger on signup
- `org-logos` storage bucket

### Create the first admin user
```bash
node scripts/setup-admin.mjs
```

This creates `tech@atriafoundation.org` / `@helloworlD` with the "Atria Foundation" org and admin role. Override with positional args:
```bash
node scripts/setup-admin.mjs [email] [password] [org-name]
```

### Confirm users
If your project has email confirmation enabled, go to Authentication → Users → click the user → "Confirm email" or toggle off email confirmation in Authentication → Providers → Email.

---

## 5. Roles & authentication

ChainLogger is in the middle of a migration from on-chain roles to Supabase-managed roles. Both coexist:

### Current — Supabase auth (preferred)
- Email + password login
- Org membership in `members` table with `member_role` enum
- `useAuth()` from `contexts/SupabaseAuthContext.tsx` returns `role`, `orgs`, `selectedOrg`
- New pages should use `SupabaseAuthContext`

### Legacy — wallet auth
- Reads roles on-chain via `getUserOrganizations`
- Lives in `contexts/AuthContext.tsx`
- Being phased out

### Role hierarchy
`viewer < vendor < finance < admin`

`ProtectedRoute` (in `src/components/auth/`) checks `requiredRole` and respects the hierarchy — an admin can see finance pages but a viewer can't see admin pages.

---

## 6. Roles in the app

| Role | Can do |
|---|---|
| **viewer** | Browse public dashboard only |
| **vendor** | Submit invoices, upload evidence for approved invoices |
| **finance** | All vendor rights + record receipts, create projects, allocate funds, approve/reject invoices and evidence |
| **admin** | All finance rights + manage org members, assign roles, pause contract |

### Routes
- `/` — public landing
- `/verify` — public receipt verification by ID
- `/login`, `/register` — auth
- `/org/create` — create new org (you become admin)
- `/org/settings` — manage members (admin only)
- `/dashboard` — role-aware overview
- `/finance/receipts`, `/finance/projects`, `/finance/allocations` — finance only
- `/vendor/invoices`, `/vendor/evidence` — vendor and above
- `/verify/[id]` — public proof page for a specific receipt

---

## 7. The on-chain flow

```
finance records receipt (bank deposit reference)
    ↓
finance creates project (IPFS charter, manager address)
    ↓
finance allocates funds (receipt → project, in cents)
    ↓
vendor submits invoice (linked to allocation, SHA-256 hash, IPFS CID)
    ↓
finance approves / rejects invoice
    ↓
vendor uploads evidence (linked to invoice, SHA-256 hash, IPFS CID)
    ↓
finance verifies / rejects evidence
    ↓
(optional) finance marks invoice paid
```

### Storage in cents
All monetary values are stored as `uint256` in cents to avoid floating-point. Conversion helpers live in `src/lib/utils.ts`:
- `usdToCents(usd)` — for input
- `centsToUsd(cents)` / `formatUsd(cents)` — for display

### Gas-efficient lookups
`_receiptAllocatedTotals` per-receipt mapping avoids O(n) scans during allocation. Per-project and per-vendor invoice indexes make dashboards cheap.

---

## 8. Frontend — running & developing

### Commands
- `npm run dev` — Next.js dev server (port 3000)
- `npm run dev:turbo` — Turbopack dev
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run start` — serve production build

### Project structure
```
src/
  app/
    (auth)/                 # login, register, org create
    (app)/                  # authenticated pages (dashboard, finance, vendor, org)
    verify/                 # public verification pages
    layout.tsx              # root layout
    providers.tsx           # WagmiProvider + QueryClientProvider
  components/
    auth/protected-route.tsx
    ui/                     # button, card, etc.
    navbar.tsx
  config/wagmi.ts           # wagmi v2 + contract ABI
  contexts/
    SupabaseAuthContext.tsx # CURRENT auth
    AuthContext.tsx         # LEGACY wallet auth
  hooks/
    use-contract-formatters.ts
    use-ipfs.ts
  lib/
    supabase/{client,server}.ts
    utils.ts                # validation + format helpers
    empty-module.js         # webpack alias stub — do not delete
  middleware.ts             # Supabase session refresh + route guard
```

### Notes
- Tailwind uses `brand-*` palette (`brand-50` through `brand-700`) plus `maroon` accent
- Path alias `@/*` → `./src/*`
- `next.config.js` aliases stub broken transitive `@x402/*` and `pino-pretty` deps — leave those in place

---

## 9. Admin operations

### Add a member to your org
1. Log in as admin
2. Go to `/org/settings`
3. Enter their email + role (finance/vendor/viewer)
4. They need to register first before you can add them

### Grant finance/vendor role on the contract
The smart contract has its own role system. The deployer's address is `ADMIN_ROLE`. To grant other roles on-chain (e.g. for vendors who haven't gone through Supabase):
```bash
cast send $CONTRACT_ADDRESS "grantRole(bytes32,address)" \
  $(cast keccak "VENDOR_ROLE") \
  0xVENDOR_ADDRESS \
  --rpc-url "$POLYGON_AMOY_RPC_URL" \
  --private-key "$PRIVATE_KEY"
```

Replace `VENDOR_ROLE` with `FINANCE_ROLE` / `VIEWER_ROLE` / `ADMIN_ROLE` as needed.

### Pause the contract
Only ADMIN_ROLE can pause:
```bash
cast send $CONTRACT_ADDRESS "pause()" --rpc-url ... --private-key ...
cast send $CONTRACT_ADDRESS "unpause()" --rpc-url ... --private-key ...
```

---

## 10. Troubleshooting

### `Failed to decode private key`
The shell isn't seeing your `.env`. Try:
```bash
set -a && source .env && set +a && forge script ...
```

### DNS error on `rpc-amoy.polygon.technology`
Public RPC isn't resolving from your network. Switch to Alchemy:
```
POLYGON_AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
```

### Login fails / "Invalid credentials"
Check the Supabase user exists in Authentication → Users. If email confirmation is enabled, you must confirm the user manually or disable the toggle in Authentication → Providers → Email.

### `ProtectedRoute` shows "Access Denied"
Your role in the selected org is too low. Switch to the right org or ask an admin to update your role in `/org/settings`.

### Frontend loads but wagmi errors
`NEXT_PUBLIC_CONTRACT_ADDRESS` isn't set or the address is malformed. Check it matches the deployed contract.

### Tests pass on my machine but fail on CI
CI uses the `ci` profile with deeper fuzzing. Locally you may need:
```bash
forge test --fuzz-runs 10000
```

### Supabase RLS blocking reads
Auth context queries the `members` and `organizations` tables under the user's JWT. Make sure:
1. The user signed in (session cookie set)
2. RLS policies from `supabase/schema.sql` are applied (run schema if newly created)

---

## Reference: contract ABI hot points

- `recordReceipt(address donor, uint256 amountUSD, string donorName, string bankReference, string bankTxHash)` — FINANCE only
- `createProject(string name, string description, string ipfsCid, address manager)` — FINANCE only
- `allocateFunds(uint256 receiptId, uint256 projectId, uint256 amountUSD, string purpose)` — FINANCE only
- `submitInvoice(uint256 allocationId, string vendorName, uint256 amountUSD, string invoiceHash, string ipfsCid, string description)` — VENDOR only
- `approveInvoice(uint256 invoiceId)` / `rejectInvoice(uint256 invoiceId, string reason)` — FINANCE only
- `markInvoicePaid(uint256 invoiceId)` — FINANCE only
- `uploadEvidence(uint256 invoiceId, string evidenceHash, string ipfsCid, string fileName, string fileType, uint256 fileSizeBytes)` — VENDOR only
- `verifyEvidence(uint256 evidenceId, string note)` / `rejectEvidence(uint256 evidenceId, string note)` — FINANCE only
- `createOrganization(string name)` — anyone
- `grantRole(bytes32 role, address account)` — ADMIN only (inherited from AccessControl)

Full ABI lives in `src/config/wagmi.ts`.
