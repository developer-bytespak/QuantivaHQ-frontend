# VC Pool — User Flow & API Guide (Mobile)

This document describes the **complete user journey** for the VC Pool feature and **which API is called at which step**. Use it to implement the same flow in the mobile app.

**Scope:** User-facing flows only. Image/screenshot upload API is out of scope for this doc.

---

## Table of Contents

1. [Auth & Headers](#1-auth--headers)
2. [User Journey — Complete Flow](#2-user-journey--complete-flow)
3. [Where Each Request Is Called](#3-where-each-request-is-called)
4. [API Reference (Request / Response)](#4-api-reference-request--response)

---

## 1. Auth & Headers

- All VC Pool APIs require **JWT** and **ELITE** tier.
- Use **Bearer token** in the `Authorization` header.

**Common headers (JSON):**

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json
Accept: application/json
```

**Base path:** `/api/vc-pools`

---

## 2. User Journey — Complete Flow

High-level user paths:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  JOURNEY A: Discover & Join a Pool                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. User opens "VC Pools" / "Market" screen                                 │
│  2. App loads list of available pools  →  GET /available                    │
│  3. User taps a pool  →  Navigate to Pool Detail                            │
│  4. App loads pool detail + payment status  →  GET /:id + GET /:id/payment-status │
│  5. User taps "Join Pool"  →  Enter payment method (e.g. Binance/wallet)   │
│  6. App creates reservation  →  POST /:id/join                             │
│  7. App shows payment instructions + countdown                             │
│  8. User pays and gets TX hash / Binance TX ID                             │
│  9. User submits TX  →  POST /:id/submit-binance-tx                        │
│ 10. App polls payment status  →  GET /:id/payment-status (every 8–30s)     │
│ 11. When payment_status = "verified"  →  User is member; show success       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  JOURNEY B: My Pools & Pool Detail (Member View)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. User opens "My Pools" screen                                             │
│  2. App loads memberships  →  GET /my-pools                                 │
│  3. User taps a pool  →  Navigate to Pool Detail                            │
│  4. App loads pool + payment status  →  GET /:id + GET /:id/payment-status  │
│  5. (Optional) If exit pending, load cancellation  →  GET /:id/my-cancellation │
│  6. Show member stats (investment, value, P&L, timeline)                    │
│  7. If user can exit  →  User taps "Request Exit"  →  POST /:id/request-exit │
│  8. App shows confirmation; optionally poll  →  GET /:id/my-cancellation  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  JOURNEY C: Payment & Transaction History (Optional Screens)                │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. User opens "My Submissions"  →  GET /payments/my-submissions             │
│  2. User taps a submission  →  GET /payments/submissions/:submissionId     │
│  3. User opens "Transactions"  →  GET /payments/my-transactions           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Where Each Request Is Called

| # | API | When / Where it is called |
|---|-----|---------------------------|
| 1 | `GET /api/vc-pools/available` | **VC Pools list / Market screen** — on load and on "Load more" (with `page`, `limit`). |
| 2 | `GET /api/vc-pools/:id` | **Pool detail screen** — when user opens a pool (by ID from list or My Pools). |
| 3 | `GET /api/vc-pools/:id/payment-status` | **Pool detail screen** — (a) on load with pool, (b) while user has an active reservation (poll every 8–30s), (c) after submitting TX until status is verified/rejected. |
| 4 | `POST /api/vc-pools/:id/join` | **Pool detail — Join flow** — when user confirms "Join" and payment method (e.g. Binance). Creates reservation and returns payment instructions. |
| 5 | `POST /api/vc-pools/:id/submit-binance-tx` | **Pool detail — Join flow** — when user submits TX hash or Binance TX ID after paying. |
| 6 | `GET /api/vc-pools/my-pools` | **My Pools screen** — on load to show all memberships (active / pending exit / closed). |
| 7 | `POST /api/vc-pools/:id/request-exit` | **Pool detail (member view)** — when user taps "Request Exit" / "Cancel membership". |
| 8 | `GET /api/vc-pools/:id/my-cancellation` | **Pool detail** — (a) on load if user is/was member, (b) optional poll when cancellation status is "pending". |
| 9 | `GET /api/vc-pools/payments/my-submissions` | **My Submissions screen** — on load. |
| 10 | `GET /api/vc-pools/payments/submissions/:submissionId` | **Submission detail screen** — when user taps a submission. |
| 11 | `GET /api/vc-pools/payments/my-transactions` | **Transactions screen** — on load. |

---

## 4. API Reference (Request / Response)

Below: method, path, headers, body (if any), and response shape for each API used in the user flow. Image upload API is not included.

---

### 4.1 Get available pools

**When:** VC Pools list / Market screen (initial load and "Load more").

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **Path** | `/api/vc-pools/available` |
| **Query** | `page` (number), `limit` (number), e.g. `?page=1&limit=20` |

**Request headers:**  
`Authorization: Bearer <JWT>`  
`Accept: application/json`

**Request body:** None

**Response (200):**

```json
{
  "pools": [
    {
      "pool_id": "uuid",
      "name": "BTC Swing Pool",
      "description": "Mid-term BTC swing trades",
      "coin_type": "USDT",
      "contribution_amount": "1000.0",
      "max_members": 100,
      "available_seats": 23,
      "duration_days": 90,
      "pool_fee_percent": "5.0",
      "payment_window_minutes": 30,
      "admin_binance_uid": "123456",
      "admin_wallet_address": "0xADMIN...",
      "payment_network": "BSC",
      "deposit_coin": "USDT",
      "deposit_method": "binance_p2p",
      "created_at": "2026-03-10T00:00:00Z"
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

---

### 4.2 Get pool by ID (detail)

**When:** Pool detail screen — when user opens a specific pool.

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **Path** | `/api/vc-pools/:id` |
| **Params** | `id` — pool UUID |

**Request headers:**  
`Authorization: Bearer <JWT>`  
`Accept: application/json`

**Request body:** None

**Response (200):**

```json
{
  "pool_id": "uuid",
  "name": "BTC Swing Pool",
  "description": "Mid-term BTC swing trades",
  "coin_type": "USDT",
  "contribution_amount": "1000.0",
  "max_members": 100,
  "available_seats": 23,
  "duration_days": 90,
  "pool_fee_percent": "5.0",
  "payment_window_minutes": 30,
  "admin_binance_uid": "123456",
  "admin_wallet_address": "0xADMIN...",
  "payment_network": "BSC",
  "deposit_coin": "USDT",
  "deposit_method": "binance_p2p",
  "created_at": "2026-03-10T00:00:00Z",
  "verified_members_count": 50,
  "reserved_seats_count": 10,
  "status": "open",
  "started_at": "2026-03-11T00:00:00Z",
  "end_date": "2026-06-11T00:00:00Z",
  "pool_financials": {
    "total_invested_usdt": 50000,
    "current_pool_value_usdt": 55000,
    "total_profit_usdt": 5000,
    "total_pool_fees_usdt": 2500,
    "pool_roi_pct": 10.0
  },
  "admin_info": {
    "binance_uid": "123456",
    "wallet_address": "0xADMIN...",
    "payment_network": "BSC",
    "deposit_coin": "USDT",
    "deposit_method": "binance_p2p"
  },
  "user_context": {
    "is_member": true,
    "member_id": "uuid",
    "invested_amount_usdt": 1000,
    "current_share_percent": 3.5,
    "joined_at": "2026-03-10T10:00:00Z",
    "exited_at": null,
    "is_active": true,
    "payment_method": "binance",
    "current_member_value_usdt": 1150,
    "unrealized_pnl_usdt": 150,
    "unrealized_pnl_pct": 15.0
  },
  "pool_timeline": {
    "started_at": "2026-03-11T00:00:00Z",
    "end_date": "2026-06-11T00:00:00Z",
    "completed_at": null,
    "days_remaining": 85,
    "progress_percent": 10
  }
}
```

- Use `user_context` to show member-specific data; if user is not a member, `user_context` may be absent or `is_member: false`.

---

### 4.3 Get payment status

**When:** Pool detail — on load, and while reservation is active or payment is pending (poll every 8–30s).

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **Path** | `/api/vc-pools/:id/payment-status` |
| **Params** | `id` — pool UUID |

**Request headers:**  
`Authorization: Bearer <JWT>`  
`Accept: application/json`

**Request body:** None

**Response (200):**

```json
{
  "pool_id": "uuid",
  "membership": {
    "exists": true,
    "is_active": true
  },
  "reservation": {
    "reservation_id": "uuid",
    "status": "active",
    "expires_at": "2026-03-13T12:34:56.000Z",
    "payment_method": "binance",
    "minutes_remaining": 18
  },
  "payment": {
    "submission_id": "uuid",
    "payment_method": "binance",
    "status": "processing",
    "total_amount": "1050.0",
    "investment_amount": "1000.0",
    "pool_fee_amount": "50.0",
    "rejection_reason": null,
    "payment_deadline": "2026-03-13T12:34:56.000Z",
    "verified_at": null,
    "tx_hash": "0x...",
    "binance_tx_id": "123456789012",
    "binance_payment_status": "pending",
    "payment_status": "pending",
    "user_wallet_address": "0xabc...",
    "exact_amount_expected": "1050.0"
  },
  "cancellation": {
    "has_cancellation": false,
    "status": "pending",
    "cancellation_id": "uuid",
    "contribution_amount": 1000,
    "pool_fee_amount": 50,
    "cancellation_fee_amount": 20,
    "refund_amount": 980,
    "requested_at": "2026-03-12T10:00:00Z",
    "approved_at": null,
    "refund_completed_at": null,
    "rejection_reason": null,
    "reviewed_by": { "name": "Admin", "email": "admin@example.com" },
    "user_wallet_address": "0xabc..."
  }
}
```

**UI logic:**

- **Member:** `membership.exists === true` and `membership.is_active === true`.
- **Reservation active:** `reservation` is not null and e.g. `reservation.status === "active"` → show countdown and payment instructions.
- **Payment state:** Use `payment.payment_status` or `payment.binance_payment_status`:  
  `"pending"` → keep polling; `"verified"` → success; `"rejected"` → show `rejection_reason`; `"refunded"` → show refund.
- **Exit/cancellation:** Use `cancellation.has_cancellation` and `cancellation.status` for exit flow.

---

### 4.4 Join pool (create reservation)

**When:** Pool detail — user taps "Join Pool" and selects payment method (e.g. Binance), then confirms.

| Item | Value |
|------|--------|
| **Method** | `POST` |
| **Path** | `/api/vc-pools/:id/join` |
| **Params** | `id` — pool UUID |

**Request headers:**  
`Authorization: Bearer <JWT>`  
`Content-Type: application/json`  
`Accept: application/json`

**Request body:**

```json
{
  "payment_method": "binance",
  "user_binance_uid": "1234567890",
  "user_wallet_address": "0xabc123..."
}
```

- `payment_method`: required, `"binance"` or `"stripe"`.
- `user_binance_uid`: optional.
- `user_wallet_address`: optional (EVM/BSC wallet).

**Response (201):**

```json
{
  "member_id": "uuid-or-null",
  "reservation_id": "uuid",
  "submission_id": "uuid",
  "total_amount": 1050,
  "investment_amount": 1000,
  "pool_fee_amount": 50,
  "coin": "USDT",
  "admin_binance_uid": "123456789",
  "admin_wallet_address": "0xADMIN...",
  "payment_network": "BSC",
  "deposit_coin": "USDT",
  "deposit_method": "binance_p2p",
  "deadline": "2026-03-13T12:34:56.000Z",
  "minutes_remaining": 30,
  "payment_method": "binance",
  "instructions": [
    "Send exactly 1050 USDT",
    "Network: BSC",
    "Include no memo"
  ],
  "message": "Reservation created",
  "is_rejoin": false,
  "previous_cancellation": {
    "cancellation_id": "uuid",
    "requested_at": "2026-02-11T10:00:00Z",
    "refunded_at": "2026-02-11T11:00:00Z",
    "refund_amount": 950
  }
}
```

- Show amounts, `admin_wallet_address` or `admin_binance_uid`, `payment_network`, `deposit_coin`, `deadline`/`minutes_remaining`, and `instructions[]`. Start countdown until `deadline`.  
- Then user pays and submits TX via **Submit TX** API.

---

### 4.5 Submit Binance TX / TX hash

**When:** Pool detail — after user has paid and has a TX hash or Binance TX ID.

| Item | Value |
|------|--------|
| **Method** | `POST` |
| **Path** | `/api/vc-pools/:id/submit-binance-tx` |
| **Params** | `id` — pool UUID |

**Request headers:**  
`Authorization: Bearer <JWT>`  
`Content-Type: application/json`  
`Accept: application/json`

**Request body:**

```json
{
  "tx_hash": "0x...",
  "binance_tx_id": "123456789012"
}
```

- Send one or both; at least one is required for verification.

**Response (200):**

```json
{
  "message": "Transaction submitted",
  "submission_id": "uuid",
  "binance_tx_id": "12345678",
  "tx_hash": "0x...",
  "exact_amount_expected": 1050,
  "status": "processing",
  "payment_status": "pending",
  "binance_payment_status": "pending"
}
```

- After this, poll **GET /:id/payment-status** until `payment_status` is `"verified"` or `"rejected"` (and optionally stop when not `"processing"`).

---

### 4.6 Get my pools

**When:** My Pools screen — on load.

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **Path** | `/api/vc-pools/my-pools` |

**Request headers:**  
`Authorization: Bearer <JWT>`  
`Accept: application/json`

**Request body:** None

**Response (200):**

```json
{
  "pools": [
    {
      "membership": {
        "member_id": "uuid",
        "pool_id": "uuid",
        "pool_name": "BTC Swing Pool",
        "pool_status": "active",
        "coin_type": "USDT",
        "is_active": true,
        "joined_at": "2026-03-10T10:00:00Z",
        "exited_at": null,
        "completed_at": null,
        "started_at": "2026-03-11T00:00:00Z",
        "end_date": "2026-06-11T00:00:00Z",
        "payment_method": "binance"
      },
      "membership_status": "active_in_pool",
      "status_detail": {
        "joined_at": "2026-03-10T10:00:00Z",
        "payout_id": null,
        "payout_amount": null,
        "profit_loss": null,
        "refund_amount": null
      },
      "my_investment": {
        "invested_amount": 1000,
        "share_percent": 3.5
      },
      "pool_performance": {
        "current_pool_value": 35000,
        "total_profit": 5000,
        "total_invested": 30000
      },
      "my_value": {
        "current_value": 1150,
        "profit_loss": 150
      },
      "cancellation": null
    }
  ]
}
```

**`membership_status` values:**  
`active_in_pool` | `completed_and_paid` | `exited_with_refund` | `rejoined_after_exit` | `exit_requested_pending_approval` | `exit_approved_pending_refund` | `pool_cancelled_refund`

- Use these to segment lists (e.g. Active / Pending exit / Closed).

---

### 4.7 Request exit (cancel membership)

**When:** Pool detail (member view) — user taps "Request Exit" / "Cancel membership".

| Item | Value |
|------|--------|
| **Method** | `POST` |
| **Path** | `/api/vc-pools/:id/request-exit` |
| **Params** | `id` — pool UUID |

**Request headers:**  
`Authorization: Bearer <JWT>`  
`Content-Type: application/json`  
`Accept: application/json`

**Request body:** `{}` (empty JSON)

**Response (200):**

```json
{
  "cancellation_id": "uuid",
  "status": "pending",
  "contribution_amount": 1000,
  "pool_fee_amount": 50,
  "cancellation_fee_amount": 20,
  "refund_amount": 980,
  "requested_at": "2026-03-12T10:00:00Z",
  "approved_at": null,
  "refund_completed_at": null,
  "rejection_reason": null,
  "reviewed_by": { "name": "Admin", "email": "admin@example.com" },
  "user_wallet_address": "0xabc...",
  "message": "Cancellation requested"
}
```

- Show success and estimated `refund_amount`; optionally poll **GET /:id/my-cancellation** or **GET /:id/payment-status** for status updates.

---

### 4.8 Get my cancellation (for a pool)

**When:** Pool detail — on load for member/exit context; optionally poll when `status === "pending"`.

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **Path** | `/api/vc-pools/:id/my-cancellation` |
| **Params** | `id` — pool UUID |

**Request headers:**  
`Authorization: Bearer <JWT>`  
`Accept: application/json`

**Request body:** None

**Response (200):**

```json
{
  "has_cancellation": true,
  "cancellation": {
    "cancellation_id": "uuid",
    "status": "pending",
    "contribution_amount": 1000,
    "pool_fee_amount": 50,
    "cancellation_fee_amount": 20,
    "refund_amount": 980,
    "requested_at": "2026-03-12T10:00:00Z",
    "approved_at": null,
    "refund_completed_at": null,
    "rejection_reason": null,
    "reviewed_by": { "name": "Admin", "email": "admin@example.com" },
    "user_wallet_address": "0xabc..."
  }
}
```

- `status`: e.g. `"pending"` | `"approved"` | `"processed"` | `"rejected"`.

---

### 4.9 Get my payment submissions

**When:** My Submissions screen — on load.

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **Path** | `/api/vc-pools/payments/my-submissions` |

**Request headers:**  
`Authorization: Bearer <JWT>`  
`Accept: application/json`

**Request body:** None

**Response (200):**

```json
[
  {
    "submission_id": "uuid",
    "pool_id": "uuid",
    "pool_name": "BTC Swing Pool",
    "coin_type": "USDT",
    "payment_method": "binance",
    "total_amount": "1050.0",
    "investment_amount": "1000.0",
    "pool_fee_amount": "50.0",
    "binance_tx_id": "123456789012",
    "tx_hash": "0x...",
    "status": "processing",
    "binance_payment_status": "pending",
    "payment_status": "pending",
    "exact_amount_expected": "1050.0",
    "exact_amount_received": null,
    "refund_reason": null,
    "rejection_reason": null,
    "verified_at": null,
    "submitted_at": "2026-03-12T09:00:00Z",
    "payment_deadline": "2026-03-12T09:30:00Z"
  }
]
```

---

### 4.10 Get payment submission detail

**When:** Submission detail screen — when user taps a submission from My Submissions.

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **Path** | `/api/vc-pools/payments/submissions/:submissionId` |
| **Params** | `submissionId` — UUID |

**Request headers:**  
`Authorization: Bearer <JWT>`  
`Accept: application/json`

**Request body:** None

**Response (200):** Same fields as a single item in **4.9**, plus e.g.:

- `screenshot_url`, `reservation_status`, `reservation_expires_at`
- `admin_binance_uid`, `admin_wallet_address`, `payment_network`, `deposit_coin`, `deposit_method`

---

### 4.11 Get my transactions

**When:** Transactions screen — on load.

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **Path** | `/api/vc-pools/payments/my-transactions` |

**Request headers:**  
`Authorization: Bearer <JWT>`  
`Accept: application/json`

**Request body:** None

**Response (200):**

```json
[
  {
    "transaction_id": "uuid",
    "pool_id": "uuid",
    "pool_name": "BTC Swing Pool",
    "transaction_type": "payment_verified",
    "amount_usdt": "1050.0",
    "binance_tx_id": "123456789012",
    "tx_hash": "0x...",
    "expected_amount": "1050.0",
    "actual_amount_received": "1050.0",
    "status": "completed",
    "description": "Payment verified",
    "created_at": "2026-03-12T09:01:00Z",
    "resolved_at": "2026-03-12T09:10:00Z"
  }
]
```

- `transaction_type`: e.g. `"payment_submitted"` | `"payment_verified"` | `"payment_rejected"`.

---

## Summary: APIs used in user flow (no image upload)

| # | Method | Path | Screen / Moment |
|---|--------|------|------------------|
| 1 | GET | `/api/vc-pools/available` | VC Pools list, load more |
| 2 | GET | `/api/vc-pools/:id` | Pool detail |
| 3 | GET | `/api/vc-pools/:id/payment-status` | Pool detail, polling after join/TX |
| 4 | POST | `/api/vc-pools/:id/join` | Join flow — create reservation |
| 5 | POST | `/api/vc-pools/:id/submit-binance-tx` | Join flow — submit TX |
| 6 | GET | `/api/vc-pools/my-pools` | My Pools list |
| 7 | POST | `/api/vc-pools/:id/request-exit` | Request exit |
| 8 | GET | `/api/vc-pools/:id/my-cancellation` | Pool detail, exit status |
| 9 | GET | `/api/vc-pools/payments/my-submissions` | My Submissions list |
| 10 | GET | `/api/vc-pools/payments/submissions/:submissionId` | Submission detail |
| 11 | GET | `/api/vc-pools/payments/my-transactions` | Transactions list |

Image/screenshot upload API is intentionally not part of this user-flow document.
