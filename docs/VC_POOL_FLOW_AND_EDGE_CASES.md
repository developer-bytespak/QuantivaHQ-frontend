# VC Pool — Admin & User Complete Flow + Edge Cases

**Purpose:** User kya kar sakta hai, admin kya karta hai, cancel/exit ke baad kya hona chahiye, admin reject par kya hona chahiye, aur saare important edge cases.

---

## 1. User Flow (End-to-End)

### 1.1 Join Pool

| Step | User action | Backend / result |
|------|-------------|------------------|
| 1 | Pool list se pool select kare | `GET /api/vc-pools/available` — sirf **open** status pools. |
| 2 | "Join Pool" click | Pool detail page par aata hai. |
| 3 | Wallet address enter kare + "Confirm & Reserve Seat" | `POST /api/vc-pools/:id/join` — **checks:** pool open, user KYC approved, **not already active member**, **no active reservation**, seat available. **Creates:** seat_reservation (status `reserved`, expires_at = now + payment_window_minutes) + payment_submission (pending). |
| 4 | Payment window mein USDT bheje (exact amount) | User bahar (Binance etc.) payment karta hai. |
| 5 | TX Hash submit kare | `POST /api/vc-pools/:id/submit-binance-tx` — submission link hota hai. Backend/Binance verification approve/reject karta hai. |
| 6a | **Approved** | Submission `verified`, reservation `confirmed`, **vc_pool_members** row **create** (is_active=true), pool counters update. User ab **member**. |
| 6b | **Rejected** | Submission `rejected`, reservation `released`, seat release. **Member create nahi hota.** User dobara join kar sakta hai (naya reservation). |

### 1.2 Already Member

- **Pool detail:** `GET /api/vc-pools/:id/payment-status` → `membership.exists` (backend `is_active` bhi bhejta hai).
- **Frontend bug:** Abhi `isMember = membership.exists` use ho raha hai; **is_active check nahi hai.** Exited user bhi "You are a member" dikh sakta hai agar backend `exists: true` bheje (see §3).
- **Member actions:** Pool details dekhna, **Request to exit pool** (cancellation request).

### 1.3 Exit / Cancel Request (User)

| Step | User action | Backend |
|------|-------------|--------|
| 1 | "Request to exit pool" | `POST /api/vc-pools/:id/cancel-membership` |
| 2 | Backend | **Checks:** user is **active** member, **no existing pending** cancellation. **Creates:** `vc_pool_cancellations` (status `pending`), refund amount = f(member value, cancellation_fee_percent). |
| 3 | User | "My cancellation" / pool page par status dikhta hai: **pending** → awaiting admin. |

**Important:** Ek member ke liye **ek hi cancellation row** hai (schema: `member_id` unique). So ek waqt par sirf ek cancellation record; purani **rejected** wali bhi isi member_id se linked.

---

## 2. Admin Flow (Relevant Parts)

### 2.1 Pool Lifecycle

- **Create** → draft → **Publish** → status `open` → users join.
- **Start** → `active` (trading).
- **Complete** → payouts.
- **Cancel (pool)** → pool `cancelled`, sab members ke liye refund payouts (alag flow).

### 2.2 Payment Verification

- **Binance:** Auto (TX hash verify) → approve ya reject.
- **Manual (e.g. Stripe/screenshot):** Admin submissions list se **Approve** / **Reject**.
- Reject par: submission `rejected`, reservation `released`, seat free. **Member create nahi.** User dobara join kar sakta hai.

### 2.3 Cancellation Request (Admin)

| Admin action | API | Backend effect |
|--------------|-----|----------------|
| List | `GET /admin/pools/:id/cancellations` | Pool ki saari cancellation requests. |
| **Approve** | `PUT /admin/pools/:id/cancellations/:cid/approve` | Cancellation status → `approved`. Refund amount (re)calculate. **Member abhi bhi active** — admin ko bahar refund karna hai. |
| **Reject** | `PUT /admin/pools/:id/cancellations/:cid/reject` (body: `rejection_reason`) | Cancellation status → `rejected`. **Member active hi rehta hai.** |
| **Mark refunded** | `PUT /admin/pools/:id/cancellations/:cid/mark-refunded` (optional binance_tx_id, notes) | **Only when status = approved.** Cancellation → `processed`, member → **is_active=false**, exited_at set, remaining members ke share recalculate, pool verified_members_count decrement. |

---

## 3. Cancellation Reject — Kya Hona Chahiye vs Ab Kya Hai

### 3.1 Intended Behaviour (Admin Reject)

- Cancellation **rejected** → user ko message: "Request rejected. You remain a member."
- User **dobara** exit request kar sake (nayi request, nayi amounts agar pool value change hua).

### 3.2 Current Behaviour (Bug)

- Schema: `vc_pool_cancellations.member_id` **unique** → ek member ka **sirf ek** cancellation row.
- Reject par: wohi row update hoti hai → status `rejected`.
- **Re-request:** `requestCancellation` sirf **pending** wali check karta hai (`findFirst` status pending). Rejected milti nahi, to code aage chal ke **create** karta hai. Lekin same `member_id` ke saath naya row **create nahi ho sakta** (unique constraint) → **error (e.g. unique violation).**
- **Result:** Admin ne reject kiya to user **dobara cancellation request nahi kar sakta** — ye bug hai.

### 3.3 Fix (Recommendation)

**Option A (preferred):** Rejected cancellation ko "re-request" allow karo — same row ko wapas **pending** banao (with fresh amounts):

- `requestCancellation` mein: agar is member ki **rejected** cancellation hai to **update** that row to status `pending`, naye amounts, requested_at = now. **Create** mat karo.
- Schema same rahega (one row per member).

**Option B:** One cancellation per member hatao: multiple cancellation rows allow karo (member_id unique hatao, e.g. member_id + requested_at ya sequence). Phir create hamesha naya row. UI/API mein "latest" cancellation dikhana.

---

## 4. Exit / Refund Complete — Dobara Pool Join

### 4.1 Intended Behaviour

- Admin ne cancellation **approve** kiya, phir **mark refunded** kiya → member **is_active = false**.
- Us user ko **dobara isi pool mein join** karne dena chahiye (naya payment, naya member lifecycle).

### 4.2 Current Behaviour

- **Join:** `joinPool` check karta hai: `existingMember && existingMember.is_active` → agar **inactive** member hai to **Conflict throw nahi** karta → user reservation le sakta hai. **OK.**
- **Payment verify (approve):** Dono jagah (Binance auto + manual approve) **vc_pool_members.create** karte hain. Schema: **@@unique([pool_id, user_id])** → ek user + pool ke liye **ek hi row**.
- **Result:** Exited user (inactive row already hai) jab dobara join karke payment complete karega to **create** fail hoga → **unique constraint violation.**  
- **Conclusion:** **Re-join after exit ab backend par fail hota hai** — fix zaroori hai.

### 4.3 Fix (Recommendation)

Payment verify (Binance `handleApproved` + PaymentReviewService `approvePayment`) mein:

- Pehle **find** karo: `vc_pool_members` where `pool_id` + `user_id`.
- Agar **exists** aur **is_active = false** (exited):
  - **Update** that row: `is_active = true`, `exited_at = null`, `invested_amount_usdt`, `share_percent` (etc.) set karo, `joined_at` optional update.
- Agar exists nahi:
  - **Create** new member (current behaviour).

(Share recalc pool start par ya existing logic ke hisaab se.)

---

## 5. Frontend: Member vs Exited

### 5.1 Backend

- `getPaymentStatus` → `membership: { exists: true, is_active: false, ... }` (exited).
- `getMyPools` → saari memberships (active + inactive) aati hain; har item mein pool + cancellation status.

### 5.2 Frontend Bug

- Pool detail page: `isMember = Boolean(paymentStatus?.membership?.exists)`.
- **Problem:** `is_active` use nahi ho raha. Agar backend `exists: true` bhejta hai (inactive bhi), to UI "You are a member" dikhata rahega.
- **Fix:** `isMember = Boolean(paymentStatus?.membership?.exists && paymentStatus?.membership?.is_active !== false)`. (Backend agar `is_active` bhejta hai to use karo; default true consider karo agar key missing ho.)

---

## 6. Edge Cases Summary Table

| # | Scenario | Expected | Current | Action |
|---|----------|----------|---------|--------|
| 1 | User payment **rejected** (admin/auto) | Dobara join kar sake | ✅ Can join again (no member row) | — |
| 2 | User **reservation expire** (payment nahi kiya) | Seat release, user dobara join kar sake | ✅ Scheduler reservation expired + submission expired, seat decrement. Join again allowed | — |
| 3 | User **exit request** → Admin **reject** | User same pool mein member rahe, **dobara exit request** kar sake | ❌ Re-request par create fails (unique member_id) | Backend: re-request = update rejected → pending (Option A) ya schema change (Option B) |
| 4 | User **exit request** → Admin **approve** → Admin **mark refunded** | Member inactive, refund done | ✅ Member is_active=false, shares recalc | — |
| 5 | User **exited** (refund done) → **dobara same pool join** | Naya reservation, naya payment, member **reactivate** (update) | ❌ Payment verify par member create → unique violation | Backend: verify flow mein upsert (update if inactive exists) |
| 6 | Pool detail: user **exited** (inactive member) | "Not a member" / "Join again" | ⚠️ Depends on backend; frontend uses only `exists` | Frontend: use `is_active` for isMember |
| 7 | User **pending cancellation** rakhe → dobara "Request exit" | Block (already pending) | ✅ Backend throws "already have a pending cancellation request" | — |
| 8 | User **payment pending** (reservation active) → same pool dubara join | Block (active reservation) | ✅ Backend "You already have an active reservation" | — |
| 9 | Pool status **open** nahi (e.g. full, active) | Join block | ✅ "Pool is not open for joining" | — |
| 10 | KYC not approved | Join block | ✅ ForbiddenException KYC message | — |
| 11 | Pool **cancelled** (admin cancelled pool) | Members get refund payouts; join nahi | Separate flow (cancelPool) | — |
| 12 | Cancel request **approved** but admin ne abhi **mark refunded** nahi kiya | Member abhi bhi active, refund pending | ✅ Member active until markRefunded | — |

---

## 7. Flow Diagrams (Text)

### 7.1 User Join → Member

```
[User] Join Pool (wallet) → [Backend] Reserve seat + submission
       → User pays (off-site)
       → User submits TX Hash
       → [Backend] Verify → Approve → Create member (or Reject → release seat)
```

### 7.2 User Exit Request

```
[User] Request exit
       → [Backend] Create cancellation (pending)
       → [Admin] Approve → status approved (member still active)
       → [Admin] Mark refunded → member is_active=false, refund done

       OR

       → [Admin] Reject → status rejected (member remains active)
       → [User] Re-request exit → currently BROKEN (unique member_id)
```

### 7.3 Re-join After Exit

```
[User] Exited (refund done)
       → [User] Join again (reserve + pay)
       → [Backend] On payment verify → CREATE member
       → currently FAILS (unique pool_id + user_id) → need UPSERT (update inactive row)
```

---

## 8. Recommendations (Short)

1. **Admin reject ke baad re-request:** Backend mein rejected cancellation ko update karke `pending` banao (naye amounts ke saath), ya schema change karke multiple cancellations allow karo.
2. **Re-join after exit:** Payment verification (Binance + manual) mein inactive member ho to **update** that row (reactivate); na ho to **create**.
3. **Frontend isMember:** Pool detail par `isMember` ke liye `membership.exists && membership.is_active !== false` use karo.
4. **UI copy:** Admin reject par user ko clear message: "Your exit request was rejected. You remain a member. You can submit a new exit request if needed." — aur re-request fix ke baad "Request exit again" allow karo.
5. **My Pools:** Agar backend already active/inactive bhejta hai to "My Pools" mein "Exited" / "Active" label se dikhao taake user ko clear ho.

---

**Document end.** Implementation order: (1) re-request after reject (backend), (2) re-join after exit (backend upsert), (3) frontend is_active for isMember.
