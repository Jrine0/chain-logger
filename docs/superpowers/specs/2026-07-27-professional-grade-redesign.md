# ChainLogger — Professional-Grade Web App Design

**Date:** 2026-07-27
**Status:** Draft — awaiting approval

---

## 1. Overview

Transform ChainLogger from a scaffolded dual-stack Web3 app into a professional-grade web application. The core principle: **Web2-first auth with Web3 as the execution layer**.

Users log in via email/password (Supabase Auth), access their organization, and only connect their wallet when they need to perform a write operation on-chain. Read-only data is accessible to everyone without any auth.

**Production URLs:**
- App: `https://chain-logger.vercel.app`
- Docs: same domain, sub-routes

---

## 2. Authentication & Identity

### 2.1 Supabase Stack

| Component | Choice | Rationale |
|---|---|---|
| Auth | Supabase Auth | Email/password, magic links, session management, built-in |
| Database | Supabase Postgres | Hosted, RLS policies, no infra to manage |
| File Storage | Supabase Storage | Org logos, small files |
| Client | `@supabase/supabase-js` + `@supabase/ssr` | SSR-safe, works with Next.js App Router |

### 2.2 Database Schema

**Tables:**
- `organizations` — id, name, slug (unique), description, created_at, created_by
- `members` — user_id, org_id, role (admin/finance/vendor/viewer), joined_at. Unique (user_id, org_id)
- `profiles` — id (FK to auth.users), full_name, website, country, wallet_address, created_at, updated_at

**Auto-provisioning:** Trigger on `auth.users` INSERT auto-creates a profile row.

**RLS Policies:**
- Organizations: admins manage, members read
- Members: admins manage, members read their org
- Profiles: users manage their own

### 2.3 Auth Flow

```
Landing page (public dashboard)
    ↓
"Access Your Org" button
    ↓
Login / Register (email + password)
    ↓
Org selection (if user belongs to multiple orgs)
    ↓
Dashboard with org context
    ↓
[Write action needed] → Wallet connect prompt → Verify on-chain role → Execute
```

### 2.4 Role Mapping

Supabase role → On-chain role mapping happens at wallet connect time:
- `admin` → `ADMIN_ROLE` + `FINANCE_ROLE`
- `finance` → `FINANCE_ROLE`
- `vendor` → `VENDOR_ROLE`
- `viewer` → `VIEWER_ROLE`

---

## 3. Frontend Architecture

### 3.1 File Structure

```
src/
  app/
    (auth)/                    # Auth group — unauthenticated
      login/page.tsx
      register/page.tsx
    (app)/                     # App group — authenticated
      layout.tsx               # App shell with sidebar/nav
      dashboard/page.tsx
      org/
        settings/page.tsx
        members/page.tsx
      finance/
        receipts/page.tsx
        projects/page.tsx
        allocations/page.tsx
      vendor/
        invoices/page.tsx
        evidence/page.tsx
      verify/
        page.tsx               # Public, no auth needed
    layout.tsx                 # Root layout
    page.tsx                   # Public landing / dashboard
    providers.tsx
    globals.css
  components/
    auth/
      protected-route.tsx      # Reroutes to login if not authenticated
      login-form.tsx
      register-form.tsx
    layout/
      navbar.tsx
      sidebar.tsx
      org-switcher.tsx
    ui/
      button.tsx, card.tsx, input.tsx, badge.tsx, ...
    shared/
      data-table.tsx           # Generic sortable/filterable table
      status-badge.tsx
      transaction-button.tsx   # Wallet connect + execute pattern
  contexts/
    SupabaseAuthContext.tsx     # Supabase auth state
    OrgContext.tsx             # Selected org, role, permissions
    WalletContext.tsx          # Wallet state for write operations
  hooks/
    use-contract.ts            # Contract read/write hooks
    use-ipfs.ts
    use-formatters.ts
  lib/
    supabase/
      client.ts                # Browser client
      server.ts                # Server component client
    utils.ts
  middleware.ts                 # Route protection + session refresh
```

### 3.2 Key Patterns

**Auth protection:** Middleware + `ProtectedRoute` component. Auth group routes redirect authenticated users. App group routes redirect unauthenticated users.

**Wallet for writes only:** A `TransactionButton` component wraps wallet connect + contract write in one flow. Read operations use public RPC (no wallet needed).

**Data fetching:** React Query (existing) for client-side contract reads. Server components for Supabase data. Unified cache invalidation after on-chain transactions.

---

## 4. Smart Contract (No Changes)

The existing `ChainLogger.sol` is solid. No contract changes needed for Phase 1.

**Frontend integration:**
- Read operations: public RPC via `viem` (no wallet)
- Write operations: require wallet + role verification via `getVendorInvoices` / on-chain checks
- Event indexing: React Query subscriptions to contract events for real-time updates

---

## 5. Implementation Phases

### Phase 1: Supabase Foundation (Weeks 1-2)
1. Run `supabase/schema.sql` on the project
2. Build auth pages (login, register, onboarding)
3. Build `SupabaseAuthContext` + `OrgContext`
4. Build protected route system + middleware
5. Org switcher in navbar
6. Wire public landing page to show data without auth

**Deliverable:** Users can register, log in, create/join orgs, and see the public dashboard.

### Phase 2: Finance Portal (Weeks 3-4)
1. Receipts page — list + create form
2. Projects page — list + create form
3. Allocations page — list + create form
4. Wire each form to contract write operations (wallet connect flow)
5. Transaction confirmation UI (toasts, loading states)

**Deliverable:** Finance team can record receipts, create projects, allocate funds end-to-end.

### Phase 3: Vendor Portal (Week 5)
1. Invoices page — list + submit form
2. Evidence page — list + upload form
3. Wire to contract writes + IPFS upload

**Deliverable:** Vendors can submit invoices and upload evidence.

### Phase 4: UX Polish (Week 6)
1. Skeleton loaders for all data tables
2. Toast notification system (success/error for transactions)
3. Sortable/filterable data tables
4. Mobile responsive sidebar + navbar
5. Dark mode toggle

**Deliverable:** App feels responsive and polished.

### Phase 5: Production Readiness (Week 7)
1. Environment validation + error boundaries
2. CI/CD pipeline (lint + build + test)
3. Vercel deployment config
4. Error monitoring (Sentry or similar)
5. README with setup + architecture docs

**Deliverable:** Production-ready, deployable, documented.

---

## 6. Technical Decisions

| Decision | Choice | Why |
|---|---|---|
| Auth | Supabase Auth | No custom backend, RLS handles isolation |
| Database | Supabase Postgres | Managed, RLS, scales |
| File storage | Supabase Storage | Small files (logos), IPFS for large docs |
| State management | React Context + React Query | Sufficient for this scale, no Redux needed |
| Styling | Tailwind (existing) | Already in place, consistent |
| Wallet lib | Wagmi + Viem (existing) | Already integrated, works |
| Deployment | Vercel (existing) | Already configured |

---

## 7. Out of Scope (Phase 1)

- Multi-language support
- Advanced analytics / reporting
- Email notifications
- Mobile native app
- Token gating / paid features
- Custom domain setup
- On-chain identity (ENS, Lens, etc.)

---

## 8. Success Criteria

- [ ] New user can register, create an org, and access the dashboard in < 2 minutes
- [ ] Finance user can record a receipt and allocate funds with ≤ 3 wallet signatures
- [ ] Vendor user can submit an invoice and upload evidence with ≤ 2 wallet signatures
- [ ] Public can view all data without connecting a wallet
- [ ] All pages responsive on mobile (375px) and desktop (1440px)
- [ ] Build passes with zero warnings, zero lint errors
- [ ] Lighthouse score > 90 on all pages
