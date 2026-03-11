# VCPool Feature — Complete Mobile Implementation Report

**Purpose:** Implementation specification for the VCPool module in a mobile application. This document is API-centric and does not include database or backend implementation. It is structured so the entire module can be generated automatically (e.g., via a single command) inside the mobile project.

**Date:** March 11, 2025  
**Scope:** Mobile app only (API consumer).

---

## 1. Feature Overview

### 1.1 What the VCPool Feature Does

**VCPool** (VC Pool) lets users:

- **Browse** open VC (Venture Capital) trading pools created by admins.
- **Join** a pool by reserving a seat, paying the exact amount (e.g. USDT on BSC), and submitting a transaction hash for verification.
- **Track** payment submissions and verification status (pending, verified, rejected, refunded).
- **View** their pool memberships (My Pools) with investment, current value, P/L, and cancellation status.
- **Request exit** from a pool (cancellation request); admin approves/rejects and may mark refund as processed.
- **View** an audit log of payment-related transactions.

Access to the feature is **gated by subscription**: only users with **VC_POOL_ACCESS** (e.g. ELITE tier) can use it. The mobile app must check subscription/feature access before showing VCPool screens or calling VCPool APIs.

### 1.2 Available User Actions

| Action | Description | Primary API |
|--------|-------------|-------------|
| View pool list | See open pools with stats (total, avg contribution, avg duration) | GET available pools |
| View pool detail | See single pool info and join/member/cancel UI | GET pool by ID, GET payment-status |
| Join pool | Reserve seat → payment details → submit TX hash | POST join, POST submit-binance-tx |
| View payment status | See reservation, payment, and verification state | GET payment-status |
| Request exit | Request cancellation (exit) from pool | POST cancel-membership |
| View my cancellation | See cancellation status for a pool | GET my-cancellation |
| View my submissions | List all payment submissions and status | GET my-submissions |
| View submission detail | Full detail for one submission (optional screen) | GET submission by ID |
| View my pools | List memberships with value and cancellation | GET my-pools |
| View transactions | Audit log of payment events | GET my-transactions |
| Upload screenshot | Optional: upload payment screenshot (if used in flow) | POST upload-screenshot |
| Refresh / Retry | Reload list or retry after error | Same GET as screen |

---

## 2. Complete API Documentation

**Base URL:** `{BASE_URL}` (e.g. `https://api.example.com`). All paths below are relative to base URL.

**Common headers for all requests:**

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes (authenticated) | `Bearer {access_token}` |
| `Content-Type` | For POST/PUT with body | `application/json` (except file upload) |
| `x-device-id` | Optional | Device identifier for tracking (recommended) |

**Error response shape (typical):**

- Status: 4xx or 5xx
- Body: `{ "message": "string" }` or `{ "message": ["string", ...] }` (validation)
- Use first string or first element of array for user-facing message.

---

### API 1: Get Available VC Pools

| Property | Value |
|----------|--------|
| **API Name** | Get Available VC Pools |
| **Endpoint** | `GET /api/vc-pools/available` |
| **HTTP Method** | GET |
| **Headers** | `Authorization: Bearer {token}`, `x-device-id` (optional) |
| **Query params** | `page` (number, default 1), `limit` (number, default 20) |

**Request body:** None.

**Request example (conceptual):**

```
GET /api/vc-pools/available?page=1&limit=20
Authorization: Bearer eyJhbGc...
```

**Success response (200):**

```json
{
  "pools": [
    {
      "pool_id": "uuid",
      "name": "Alpha Growth Pool",
      "description": "Curated pool for growth assets",
      "coin_type": "USDT",
      "contribution_amount": "1000",
      "max_members": 20,
      "available_seats": 15,
      "duration_days": 90,
      "pool_fee_percent": "5",
      "payment_window_minutes": 30,
      "admin_binance_uid": null,
      "admin_wallet_address": "0x1234...abcd",
      "payment_network": "BSC",
      "deposit_coin": "USDT",
      "deposit_method": "on_chain",
      "created_at": "2025-03-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Error response examples:**

- **401 Unauthorized:** `{ "message": "Unauthorized" }`
- **403 Forbidden:** `{ "message": "VC Pool access requires ELITE plan" }`
- **500:** `{ "message": "Internal server error" }`

---

### API 2: Get VC Pool by ID

| Property | Value |
|----------|--------|
| **API Name** | Get VC Pool by ID |
| **Endpoint** | `GET /api/vc-pools/{poolId}` |
| **HTTP Method** | GET |
| **Headers** | `Authorization: Bearer {token}` |

**Request body:** None.

**Success response (200):**

```json
{
  "pool_id": "uuid",
  "name": "Alpha Growth Pool",
  "description": "Curated pool for growth assets",
  "coin_type": "USDT",
  "contribution_amount": "1000",
  "max_members": 20,
  "available_seats": 15,
  "duration_days": 90,
  "pool_fee_percent": "5",
  "payment_window_minutes": 30,
  "admin_binance_uid": null,
  "admin_wallet_address": "0x1234...abcd",
  "payment_network": "BSC",
  "deposit_coin": "USDT",
  "deposit_method": "on_chain",
  "created_at": "2025-03-01T00:00:00.000Z",
  "verified_members_count": 5,
  "reserved_seats_count": 2,
  "status": "open",
  "started_at": null,
  "end_date": null
}
```

**Error examples:**

- **404:** `{ "message": "Pool not found" }`
- **401/403:** As above.

---

### API 3: Get Payment Status (for a pool)

| Property | Value |
|----------|--------|
| **API Name** | Get Payment Status |
| **Endpoint** | `GET /api/vc-pools/{poolId}/payment-status` |
| **HTTP Method** | GET |
| **Headers** | `Authorization: Bearer {token}` |

**Request body:** None.

**Success response (200):**

```json
{
  "pool_id": "uuid",
  "membership": {
    "exists": true,
    "is_active": true
  },
  "reservation": {
    "reservation_id": "uuid",
    "status": "reserved",
    "expires_at": "2025-03-11T12:30:00.000Z",
    "payment_method": "binance",
    "minutes_remaining": 25
  },
  "payment": {
    "submission_id": "uuid",
    "payment_method": "binance",
    "status": "pending",
    "total_amount": "1050",
    "investment_amount": "1000",
    "pool_fee_amount": "50",
    "screenshot_url": null,
    "rejection_reason": null,
    "payment_deadline": "2025-03-11T12:30:00.000Z",
    "verified_at": null,
    "tx_hash": "0xabc...",
    "binance_tx_id": null,
    "binance_payment_status": "pending",
    "payment_status": "pending",
    "user_wallet_address": "0x...",
    "exact_amount_expected": "1050",
    "payment_status": "pending",
    "binance_payment_status": "pending"
  }
}
```

- If user has no reservation: `reservation` and/or `payment` may be `null`.
- If user is not a member: `membership.exists` is `false` (or `is_active: false` if exited).

**Error examples:** 401, 403, 404 (pool not found).

---

### API 4: Join Pool (Reserve Seat)

| Property | Value |
|----------|--------|
| **API Name** | Join Pool |
| **Endpoint** | `POST /api/vc-pools/{poolId}/join` |
| **HTTP Method** | POST |
| **Headers** | `Authorization: Bearer {token}`, `Content-Type: application/json` |

**Request body:**

```json
{
  "payment_method": "binance",
  "user_binance_uid": null,
  "user_wallet_address": "0x1234567890abcdef1234567890abcdef12345678"
}
```

- `payment_method`: required, `"binance"` or `"stripe"`.
- `user_wallet_address`: required for on-chain (BSC); BSC format: `0x` + 40 hex chars.
- `user_binance_uid`: optional (e.g. for Binance P2P when required).

**Success response (201):**

```json
{
  "reservation_id": "uuid",
  "submission_id": "uuid",
  "total_amount": 1050,
  "investment_amount": 1000,
  "pool_fee_amount": 50,
  "coin": "USDT",
  "admin_binance_uid": null,
  "admin_wallet_address": "0xAdminWallet...",
  "payment_network": "BSC",
  "deposit_coin": "USDT",
  "deposit_method": "on_chain",
  "deadline": "2025-03-11T12:30:00.000Z",
  "minutes_remaining": 30,
  "payment_method": "binance",
  "instructions": [
    "Send exactly 1050 USDT to the address below.",
    "Use BSC (BEP-20) network only."
  ],
  "message": "Seat reserved. Complete payment before deadline."
}
```

**Error response examples:**

- **400:** `{ "message": "Invalid wallet address" }`
- **403:** `{ "message": "KYC approval required to join pools" }`
- **409 Conflict:** `{ "message": "You already have an active reservation for this pool" }` or `{ "message": "You are already an active member of this pool" }`
- **400:** `{ "message": "Pool is not open for joining" }` or `{ "message": "No seats available" }`

---

### API 5: Submit TX Hash (Verify Payment)

| Property | Value |
|----------|--------|
| **API Name** | Submit TX Hash |
| **Endpoint** | `POST /api/vc-pools/{poolId}/submit-binance-tx` |
| **HTTP Method** | POST |
| **Headers** | `Authorization: Bearer {token}`, `Content-Type: application/json` |

**Request body:**

```json
{
  "tx_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

- BSC TX hash: `0x` + 64 hex characters.

**Success response (200):**

```json
{
  "message": "TX Hash submitted for verification",
  "submission_id": "uuid",
  "binance_tx_id": null,
  "tx_hash": "0x1234...",
  "exact_amount_expected": 1050,
  "status": "pending",
  "payment_status": "pending",
  "binance_payment_status": "pending"
}
```

**Error response examples:**

- **400:** `{ "message": "Invalid TX hash" }` or validation errors
- **404:** `{ "message": "No active submission found" }` (reservation expired or already verified)

---

### API 6: Cancel Membership (Request Exit)

| Property | Value |
|----------|--------|
| **API Name** | Cancel Membership |
| **Endpoint** | `POST /api/vc-pools/{poolId}/cancel-membership` |
| **HTTP Method** | POST |
| **Headers** | `Authorization: Bearer {token}` |

**Request body:** None (empty body or `{}`).

**Success response (201):**

```json
{
  "cancellation_id": "uuid",
  "pool_status_at_request": "active",
  "member_value_at_exit": 1050.50,
  "fee_amount": 52.53,
  "refund_amount": 997.97,
  "status": "pending",
  "message": "Cancellation request submitted. Awaiting admin approval."
}
```

**Error response examples:**

- **403:** `{ "message": "You are not an active member of this pool" }`
- **409:** `{ "message": "You already have a pending cancellation request" }`

---

### API 7: Get My Cancellation (for a pool)

| Property | Value |
|----------|--------|
| **API Name** | Get My Cancellation |
| **Endpoint** | `GET /api/vc-pools/{poolId}/my-cancellation` |
| **HTTP Method** | GET |
| **Headers** | `Authorization: Bearer {token}` |

**Request body:** None.

**Success response (200):**

```json
{
  "has_cancellation": true,
  "cancellation": {
    "cancellation_id": "uuid",
    "status": "pending",
    "requested_at": "2025-03-11T10:00:00.000Z",
    "member_value_at_exit": 1050.50,
    "fee_amount": 52.53,
    "refund_amount": 997.97,
    "reviewed_at": null,
    "reviewed_by": null,
    "rejection_reason": null,
    "refunded_at": null
  }
}
```

- If no cancellation: `has_cancellation: false`, `cancellation` may be absent.
- `status`: `pending` | `approved` | `rejected` | `processed`.

**Error examples:** 401, 403.

---

### API 8: Get My Pools

| Property | Value |
|----------|--------|
| **API Name** | Get My Pools |
| **Endpoint** | `GET /api/vc-pools/my-pools` |
| **HTTP Method** | GET |
| **Headers** | `Authorization: Bearer {token}` |

**Request body:** None.

**Success response (200):**

```json
{
  "pools": [
    {
      "membership": {
        "member_id": "uuid",
        "pool_id": "uuid",
        "pool_name": "Alpha Growth Pool",
        "pool_status": "active",
        "coin_type": "USDT",
        "started_at": "2025-03-01T00:00:00.000Z",
        "end_date": "2025-05-30T00:00:00.000Z",
        "payment_method": "binance"
      },
      "my_investment": {
        "invested_amount": 1000,
        "share_percent": 5.5
      },
      "pool_performance": {
        "current_pool_value": 22000,
        "total_profit": 2000,
        "total_invested": 20000
      },
      "my_value": {
        "current_value": 1100,
        "profit_loss": 100
      },
      "cancellation": null
    }
  ]
}
```

- `cancellation` is `null` or the same shape as in API 7.

**Error examples:** 401, 403.

---

### API 9: Get My Payment Submissions

| Property | Value |
|----------|--------|
| **API Name** | Get My Payment Submissions |
| **Endpoint** | `GET /api/vc-pools/payments/my-submissions` |
| **HTTP Method** | GET |
| **Headers** | `Authorization: Bearer {token}` |

**Request body:** None.

**Success response (200):**

```json
[
  {
    "submission_id": "uuid",
    "pool_id": "uuid",
    "pool_name": "Alpha Growth Pool",
    "coin_type": "USDT",
    "payment_method": "binance",
    "total_amount": "1050",
    "investment_amount": "1000",
    "pool_fee_amount": "50",
    "binance_tx_id": null,
    "tx_hash": "0x...",
    "status": "verified",
    "binance_payment_status": "verified",
    "payment_status": "verified",
    "exact_amount_expected": "1050",
    "exact_amount_received": "1050",
    "refund_reason": null,
    "rejection_reason": null,
    "verified_at": "2025-03-11T11:00:00.000Z",
    "submitted_at": "2025-03-11T10:45:00.000Z",
    "payment_deadline": "2025-03-11T12:30:00.000Z"
  }
]
```

**Error examples:** 401, 403.

---

### API 10: Get Payment Submission Detail

| Property | Value |
|----------|--------|
| **API Name** | Get Payment Submission Detail |
| **Endpoint** | `GET /api/vc-pools/payments/submissions/{submissionId}` |
| **HTTP Method** | GET |
| **Headers** | `Authorization: Bearer {token}` |

**Request body:** None.

**Success response (200):** Same fields as one item in API 9, plus:

```json
{
  "submission_id": "uuid",
  "pool_id": "uuid",
  "pool_name": "Alpha Growth Pool",
  "coin_type": "USDT",
  "payment_method": "binance",
  "total_amount": "1050",
  "investment_amount": "1000",
  "pool_fee_amount": "50",
  "binance_tx_id": null,
  "tx_hash": "0x...",
  "status": "verified",
  "binance_payment_status": "verified",
  "payment_status": "verified",
  "exact_amount_expected": "1050",
  "exact_amount_received": "1050",
  "refund_reason": null,
  "rejection_reason": null,
  "verified_at": "2025-03-11T11:00:00.000Z",
  "submitted_at": "2025-03-11T10:45:00.000Z",
  "payment_deadline": "2025-03-11T12:30:00.000Z",
  "screenshot_url": "https://...",
  "reservation_status": "confirmed",
  "reservation_expires_at": "2025-03-11T12:30:00.000Z",
  "admin_binance_uid": "",
  "admin_wallet_address": "0x...",
  "payment_network": "BSC",
  "deposit_coin": "USDT",
  "deposit_method": "on_chain"
}
```

**Error examples:** 401, 403, 404.

---

### API 11: Get My Transactions

| Property | Value |
|----------|--------|
| **API Name** | Get My Transactions |
| **Endpoint** | `GET /api/vc-pools/payments/my-transactions` |
| **HTTP Method** | GET |
| **Headers** | `Authorization: Bearer {token}` |

**Request body:** None.

**Success response (200):**

```json
[
  {
    "transaction_id": "uuid",
    "pool_id": "uuid",
    "pool_name": "Alpha Growth Pool",
    "transaction_type": "payment_verified",
    "amount_usdt": "1050",
    "binance_tx_id": null,
    "tx_hash": "0x...",
    "expected_amount": "1050",
    "actual_amount_received": "1050",
    "status": "verified",
    "description": "Payment verified for pool Alpha Growth Pool",
    "created_at": "2025-03-11T10:45:00.000Z",
    "resolved_at": "2025-03-11T11:00:00.000Z"
  }
]
```

- `transaction_type`: `payment_submitted` | `payment_verified` | `payment_rejected`.

**Error examples:** 401, 403.

---

### API 12: Upload Payment Screenshot (Optional)

| Property | Value |
|----------|--------|
| **API Name** | Upload Payment Screenshot |
| **Endpoint** | `POST /api/vc-pools/{poolId}/upload-screenshot` |
| **HTTP Method** | POST |
| **Headers** | `Authorization: Bearer {token}`. Do **not** set `Content-Type`; use `multipart/form-data` with boundary. |

**Request body:** `multipart/form-data` with field name `screenshot` (file).

**Success response (200):**

```json
{
  "message": "Screenshot uploaded",
  "submission_id": "uuid",
  "screenshot_url": "https://..."
}
```

**Error response examples:**

- **400:** `{ "message": "No active submission found" }`
- **413:** File too large (if backend enforces)

---

## 3. Mobile App User Flow

### 3.1 Step-by-Step User Journey

1. **Entry**
   - User opens app and has ELITE (or equivalent) subscription with VC_POOL_ACCESS.
   - User navigates to **VC Pool** (e.g. tab or menu item).

2. **Pool list**
   - App shows **VC Pool List** screen.
   - API: `GET /api/vc-pools/available?page=1&limit=20`.
   - User sees stats (total pools, avg contribution, avg duration) and list of pool cards. Each card: name, description, contribution, fee %, duration, seats filled/total, deposit address (truncated), "View details & join".

3. **Pool detail**
   - User taps a pool card (or "View details & join").
   - Navigate to **Pool Detail** with `poolId`.
   - APIs: `GET /api/vc-pools/{poolId}`, `GET /api/vc-pools/{poolId}/payment-status` (and optionally `GET /api/vc-pools/{poolId}/my-cancellation` when user is member).
   - Screen shows: pool header (name, description, contribution, duration, seats), then one of:
     - **Not a member, pool open, no reservation:** "Join Pool" button.
     - **Not a member, has reservation:** 3-step join flow (Wallet → Payment details → Submit TX Hash).
     - **Member:** "You are a member" + cancellation block (request exit / cancellation status).
     - **Rejected:** Message + "You can join again" and join CTA.
     - **Pool closed/full:** Message that pool is not open or full.

4. **Join flow (3 steps)**
   - **Step 1 — Enter wallet:** User enters BSC wallet address. Validate: `0x` + 40 hex. On "Confirm & Reserve Seat" → `POST /api/vc-pools/{poolId}/join` with `payment_method`, `user_wallet_address`. On success → go to Step 2; store `joinResponse` for amounts and instructions.
   - **Step 2 — Payment details:** Show exact amount, admin deposit address (with Copy), network/coin, deadline, countdown timer, instructions. User pays off-app (e.g. Binance). On "I've completed the payment" → go to Step 3.
   - **Step 3 — Submit TX Hash:** User pastes TX hash. Validate: `0x` + 64 hex. On "Verify Payment" → `POST /api/vc-pools/{poolId}/submit-binance-tx` with `tx_hash`. Then show status: pending/processing (poll payment-status), verified (success), rejected (show reason + "Try again"), refunded.

5. **After join**
   - If verified: user is member; pool detail shows member block. Optionally poll or refresh payment-status once to update UI.
   - If rejected: show rejection reason; user can start join again from Step 1.

6. **Request exit (member)**
   - On Pool Detail, if user is member and pool allows exit: "Request to exit pool" → `POST /api/vc-pools/{poolId}/cancel-membership`. Show success toast; refresh `GET my-cancellation` and payment-status. Show cancellation status (pending / approved / rejected / processed).

7. **My Submissions**
   - From list or nav: **My Submissions** screen. API: `GET /api/vc-pools/payments/my-submissions`. Show list of submissions (pool name, date, status, amounts, TX hash, "View pool" → Pool Detail). Optional: "View details" → **Submission Detail** with `GET /api/vc-pools/payments/submissions/{submissionId}`.

8. **My Pools**
   - **My Pools** screen. API: `GET /api/vc-pools/my-pools`. Tabs or sections: "My pools" (active) vs "Cancellation pools" (exited/cancelled). Each card: pool name, status, investment, current value, P/L, cancellation status, "View Detail" → Pool Detail.

9. **Transactions**
   - **Transactions** screen. API: `GET /api/vc-pools/payments/my-transactions`. List of events (payment_submitted, payment_verified, payment_rejected) with pool name, amount, status, TX hash, dates.

### 3.2 Screen-to-Screen Flow and APIs

| From screen       | User action           | To screen        | API(s) called on target screen (or before nav) |
|------------------|------------------------|------------------|-----------------------------------------------|
| App / Home       | Open VC Pool          | Pool List        | GET available (page 1)                        |
| Pool List        | Pull-to-refresh / Refresh | Pool List    | GET available (same page or 1)                 |
| Pool List        | Load more             | Pool List        | GET available (page+1)                         |
| Pool List        | Tap pool card         | Pool Detail      | GET pool by ID, GET payment-status            |
| Pool Detail      | Tap "Join Pool"       | (same, Step 1)   | —                                             |
| Pool Detail      | Confirm wallet        | (same, Step 2)   | POST join                                     |
| Pool Detail      | "I've completed payment" | (same, Step 3) | —                                             |
| Pool Detail      | Submit TX hash        | (same, status)   | POST submit-binance-tx                         |
| Pool Detail      | Request exit          | (same)           | POST cancel-membership; then GET my-cancellation |
| Pool Detail      | Back                  | Pool List        | —                                             |
| Pool List        | My submissions        | My Submissions   | GET my-submissions                            |
| My Submissions   | View pool             | Pool Detail      | GET pool, GET payment-status                  |
| My Submissions   | View details (opt)    | Submission Detail| GET submission by ID                          |
| Pool List / etc  | My pools              | My Pools         | GET my-pools                                  |
| My Pools         | View Detail           | Pool Detail      | GET pool, GET payment-status                  |
| Pool List / etc  | Transactions          | Transactions     | GET my-transactions                            |
| Any list         | Refresh / Retry       | Same             | Same GET as screen                            |

---

## 4. UI Screens

### 4.1 Screen List

| # | Screen name        | Route / ID (suggestion)     | Purpose |
|---|--------------------|-----------------------------|--------|
| 1 | VC Pool List       | `/vc-pool` or `VCPoolList`  | Browse open pools, stats, navigate to detail / my submissions / my pools / transactions |
| 2 | Pool Detail         | `/vc-pool/:poolId` or `VCPoolDetail` | Pool info, join flow (3 steps), member view, request exit, cancellation status |
| 3 | My Submissions      | `/vc-pool/my-submissions` or `MySubmissions` | List payment submissions, status, link to pool or submission detail |
| 4 | Submission Detail   | `/vc-pool/my-submissions/:submissionId` or `SubmissionDetail` (optional) | Full submission + screenshot + instructions |
| 5 | My Pools            | `/vc-pool/my-pools` or `MyPools` | List memberships; tabs: My pools / Cancellation pools |
| 6 | Transactions        | `/vc-pool/transactions` or `Transactions` | Audit list of payment events |

### 4.2 UI Components and User Actions by Screen

**1. VC Pool List**

- **Components:** App bar with title "VC Pool Access"; subtitle; feature gate (if no access: overlay + upgrade CTA). Stats row: Open pools count, Avg contribution, Avg duration. Refresh button; primary buttons: "My submissions", "Transactions", "My pools". List: pool cards (name, description, min investment, pool fee %, payment window, progress bar filled/total seats, duration, created, deposit address truncated + Copy, CTA "View details & join"). Load more / pagination when `page < totalPages`.
- **User actions:** Refresh, Open My Submissions, Open Transactions, Open My Pools, Tap pool card (→ Pool Detail), Copy deposit address, Load more.

**2. Pool Detail**

- **Components:** Back to VC pools. Pool header (name, description, contribution, duration, available seats). If loading: spinner. If error: error message (+ optional Retry). If no access: locked overlay.
- **States:**
  - **Not member, pool open, no reservation:** Single CTA "Join Pool".
  - **Not member, join flow:** Step indicator (1–Wallet, 2–Payment details, 3–Submit TX). Step 1: Wallet input, network/coin/method read-only, Cancel + "Confirm & Reserve Seat". Step 2: Countdown, exact amount, admin address + Copy, instructions, warning, "I've completed the payment". Step 3: Amount reminder, TX hash input, Back + "Verify Payment"; or after submit: status card (pending/processing, verified, rejected, refunded) with appropriate CTAs.
  - **Member:** "You are a member" block; if exit allowed: cancellation section (status or "Request to exit pool" button).
  - **Rejected:** Message + reason + "Join again".
  - **Pool closed/full:** Message.
- **Footer:** Pool details card (status, max members, fee, payment window); Admin account card (deposit address, network, coin, method).
- **User actions:** Back, Join Pool, Cancel/Confirm wallet, Copy address, Proceed to TX, Submit TX hash, Back (step 3), Request exit, Retry, View pool details (after verified).

**3. My Submissions**

- **Components:** Back to VC pools. Title, subtitle. Refresh, "Transaction history" button. Loading spinner. Error + Try again. Empty state (no submissions) + link to browse pools. List: cards per submission (pool name, submitted date, deadline, status badge, "View pool"); total amount (invest + fee), TX hash, verification status, expected amount, verified date; optional refund/rejection message.
- **User actions:** Back, Refresh, Try again, View pool (→ Pool Detail), optional View details (→ Submission Detail).

**4. Submission Detail (optional)**

- **Components:** Back to My Submissions. Submission data: pool name, amounts, status, TX hash, screenshot (if any), instructions, admin wallet, network/coin, deadline, reservation status.
- **User actions:** Back, optional "View pool" → Pool Detail.

**5. My Pools**

- **Components:** Back to VC pools. Title, subtitle. Refresh. Loading; Error + Try again. Empty state + link to browse. Tabs: "My pools" | "Cancellation pools". For active: card per pool (name, status, started/end, "View Detail"); my investment, share %; my value, P/L; pool value, profit; cancellation (none or status + refund amount). For cancellation tab: short info text; same card type.
- **User actions:** Back, Refresh, Try again, Switch tab, View Detail (→ Pool Detail).

**6. Transactions**

- **Components:** Back to VC pools. Title, subtitle. Refresh, "My submissions" button. Loading; Error + Try again. Empty state + link to browse. List: item per transaction (icon by type, type label, pool name, amount, status badge, description, TX hash, expected/received, created/resolved dates).
- **User actions:** Back, Refresh, Try again, Open My Submissions.

---

## 5. State Handling

### 5.1 Loading States

- **List screens (Pool list, My Submissions, My Pools, Transactions):** On first load or Refresh, show full-screen or inline spinner; disable Refresh/Load more during request. Optionally show skeleton cards instead of spinner.
- **Pool Detail:** On entry, show spinner until pool + payment-status (and my-cancellation when member) are loaded.
- **Join flow:** "Confirm & Reserve Seat" → button shows "Reserving seat…" and spinner; "Verify Payment" → "Submitting…" and spinner. Disable primary button while request in progress.
- **Request exit:** Button "Submitting…" and disabled while `POST cancel-membership` is in progress.

### 5.2 Error States

- **API error (4xx/5xx):** Parse `response.data.message` (string or array); show message in a banner or inline error box. Provide **Try again** (or **Retry**) that clears error and re-calls the same API. On list screens, keep previous data if any; on Pool Detail, optionally keep pool and show error only for payment-status or for action (join / submit TX / cancel).
- **Validation errors (e.g. wallet, TX hash):** Show inline error under field or toast; do not call API until valid. Use same message shape from backend if available.
- **Network error:** Treat as generic error; show "Check connection and try again" and Retry.

### 5.3 Success States

- **Join (reserve seat):** Toast: "Seat reserved! Complete payment before the deadline." Navigate to Step 2; store join response for amounts/instructions.
- **Submit TX hash:** Toast: "TX Hash submitted. Waiting for admin approval." Show pending/processing state; poll payment-status every 8–30 s until status is verified/rejected/refunded.
- **Payment verified:** Show success card "Payment confirmed! You are now a member." CTA "View pool details" → refresh pool + payment-status and show member block.
- **Payment rejected:** Show rejected card with reason; CTA "Try joining again" → reset join flow and reload payment-status.
- **Request exit:** Toast: "Cancellation request submitted. Awaiting admin approval." Refresh my-cancellation and show status.

---

## 6. Complete Mobile Implementation Logic

### 6.1 API Calling Logic

- **Base URL:** From app config (e.g. `BASE_URL`).
- **Auth:** Attach `Authorization: Bearer {accessToken}` to every request (get token from secure store after login).
- **Device ID:** Optional header `x-device-id` for consistency with web.
- **GET requests:** No body; use query params for pagination (`page`, `limit`).
- **POST with JSON:** `Content-Type: application/json`; body as in Section 2.
- **File upload (screenshot):** `POST` with `multipart/form-data`, field name `screenshot`; do not set Content-Type (boundary set by client).
- **Errors:** Read `error.response?.data?.message` (string or array); display first string. Use a single helper e.g. `getApiErrorMessage(err, fallback)`.

### 6.2 Validation Logic

- **BSC wallet address:** Regex `^0x[a-fA-F0-9]{40}$`. Trim before validate. If invalid, disable "Confirm & Reserve Seat" or show inline error.
- **BSC TX hash:** Regex `^0x[a-fA-F0-9]{64}$`. Trim before validate. If invalid, disable "Verify Payment" or show inline error.
- **Feature gate:** Before showing any VCPool screen or calling any VCPool API, check subscription/plan for `VC_POOL_ACCESS`. If not allowed, show locked overlay and do not call APIs.

### 6.3 Response Handling

- **GET available:** Store `pools` and `pagination`; use `pagination.totalPages` and `pagination.page` for Load more.
- **GET pool by ID:** Store pool; use for header, details, and join eligibility (status, available_seats).
- **GET payment-status:** Derive: `isMember = membership.exists && membership.is_active !== false`; `hasReservation = reservation != null`; `payment` for amounts and verification status. Use for step detection and countdown (reservation.expires_at).
- **POST join:** Store full response; use for Step 2 (amounts, admin address, instructions, deadline). Then call GET payment-status to sync.
- **POST submit-binance-tx:** Store submission/status; show pending; poll GET payment-status until status is not pending/processing.
- **POST cancel-membership:** On success, call GET my-cancellation and optionally GET payment-status.
- **Countdown:** From `reservation.expires_at`, compute seconds remaining; update every second; at 0 show "Expired" and disable "I've completed the payment".

### 6.4 Navigation Flow

- **Stack or tab:** Pool List = root; Pool Detail = push with `poolId`; My Submissions, My Pools, Transactions = push or tab. Submission Detail = push with `submissionId` from My Submissions.
- **Back:** From Pool Detail → Pool List. From My Submissions / My Pools / Transactions → Pool List (or previous tab). From Submission Detail → My Submissions.
- **Deep link:** If app supports, `vc-pool`, `vc-pool/:poolId`, `vc-pool/my-submissions`, etc., map to above screens and trigger same APIs.

### 6.5 Polling and Timers

- **Payment-status (reservation active, not yet member):** Poll every 30 s to catch expiration or status change. Stop when user becomes member or leaves screen.
- **After TX hash submitted (pending/processing):** Poll every 8–10 s until `payment_status` or `binance_payment_status` is verified, rejected, or refunded. Stop when status is final or user leaves screen.
- **Countdown:** 1 s interval from `expires_at`; clear on unmount or when reservation is gone.

### 6.6 Member vs Exited

- Use `membership.exists && membership.is_active !== false` for "is member" (show member block and exit request). If `is_active === false` (exited), treat as not member and allow "Join Pool" again if pool is open.

---

## 7. Summary Checklist for Code Generation

- [ ] Feature gate: VC_POOL_ACCESS (subscription) before any screen or API.
- [ ] All 12 APIs implemented with correct method, path, headers, body, and response/error handling.
- [ ] 6 screens: Pool List, Pool Detail, My Submissions, Submission Detail (optional), My Pools, Transactions.
- [ ] Join flow: 3 steps (wallet → payment details → TX hash) with validation and correct API sequence.
- [ ] Pool Detail branches: idle + Join, member + cancellation, rejected, closed/full.
- [ ] Loading/error/success states and Retry/Refresh on list screens.
- [ ] Pagination (Load more) on Pool List using `page`/`limit`/`totalPages`.
- [ ] Countdown from `reservation.expires_at`; polling for payment-status when reservation active and when TX submitted pending.
- [ ] Error message helper for consistent user-facing messages from API errors.
- [ ] Navigation: back from each screen; deep routes for list, detail, my-submissions, my-pools, transactions, submission-detail.

---

**End of report.** Use this document as the single source of truth to generate the VCPool module in the mobile app (e.g. via codegen or scaffolding command).
