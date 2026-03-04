## SumSub KYC – Frontend Integration

This document explains how the QuantivaHQ frontend integrates with **SumSub** for KYC, which pages are involved, and which backend APIs are called (including their request/response shapes).

---

### 1. High‑level flow

- **KYC entry point (SDK)**:  
  - Route: `/onboarding/kyc-verification`  
  - File: `src/app/(auth)/onboarding/kyc-verification/page.tsx`  
  - Uses **SumSub Web SDK** (`@sumsub/websdk-react`) embedded in an iframe.
  - Flow:
    1. Frontend checks current user + KYC status.
    2. If KYC not approved, calls `GET /kyc/sdk-token` to get a SumSub SDK access token.
    3. Passes the token into `<SumsubWebSdk>` which handles:
       - Document capture (ID, etc.)
       - Selfie / liveness
       - Upload to SumSub
       - Progress UI, errors, and final state.

- **Status page (polling + redirects)**:
  - Route: `/onboarding/verification-status`  
  - File: `src/app/(auth)/onboarding/verification-status/page.tsx`
  - Flow:
    1. Polls `GET /kyc/status` to synchronize with SumSub.
    2. Displays:
       - Status: `pending | approved | rejected | review`
       - Reason text and any human‑readable rejection reasons.
    3. If KYC becomes `approved`, calls the shared flow router and redirects to the next onboarding/dashboard step.
    4. If rejection is `RETRY`, shows copy that the user should re‑submit.

- **Flow router (decides which page to show)**:
  - File: `src/lib/auth/flow-router.service.ts`
  - Uses `getKycStatus()` plus user profile to decide:
    - `/onboarding/personal-info`
    - `/onboarding/kyc-verification`
    - `/onboarding/verification-status`
    - `/onboarding/account-type`
    - `/dashboard`

---

### 2. Frontend API module: `src/lib/api/kyc.ts`

All KYC‑related HTTP calls are centralized here. This section documents each exported function, the backend route it calls, and the relevant request/response types.

#### 2.1 `getSdkToken()`

- **Purpose**: Fetch a short‑lived access token for the SumSub Web SDK.
- **Frontend function**:
  - File: `src/lib/api/kyc.ts`
  - Signature:
    ```ts
    export async function getSdkToken(): Promise<{
      success: boolean;
      token: string;
      userId: string;
    }>;
    ```
- **Backend endpoint**:
  - Method: `GET`
  - Path: `/kyc/sdk-token`
  - Controller: `KycController.getSdkToken()` in `q_nest/src/kyc/kyc.controller.ts`
- **Request**:
  - Authenticated request (JWT cookie/header) with the current user.
  - No body or query params from the frontend.
- **Response**:
  ```ts
  {
    success: true;
    token: string;   // SumSub SDK access token
    userId: string;  // External user ID used with SumSub (user_id in our DB)
  }
  ```
- **Usage**:
  - Called by `KycVerificationPage` to obtain the `accessToken` prop for `<SumsubWebSdk>`.

#### 2.2 `getKycStatus()`

- **Purpose**: Get the latest KYC status for the logged‑in user, synchronized with SumSub.
- **Frontend function**:
  - File: `src/lib/api/kyc.ts`
  - Signature:
    ```ts
    export async function getKycStatus(): Promise<KycStatusResponse>;
    ```
- **Backend endpoint**:
  - Method: `GET`
  - Path: `/kyc/status`
  - Service: `KycService.getStatus()` in `q_nest/src/kyc/services/kyc.service.ts`
- **Request**:
  - Authenticated request.
  - No body or query params.
- **Response type** (`KycStatusResponse` from `src/lib/api/types/kyc.ts`):
  ```ts
  export type KycStatus = "pending" | "approved" | "rejected" | "review";

  export interface KycStatusResponse {
    status: KycStatus;
    kyc_id: string | null;
    decision_reason?: string;
    liveness_result?: string;
    liveness_confidence?: number;
    face_match_score?: number;
    doc_authenticity_score?: number;
    /** Sumsub rejection type: "RETRY" (temporary) or "FINAL" (permanent) */
    review_reject_type?: string | null;
    /** Human‑readable rejection reasons assembled from SumSub data */
    rejection_reasons?: string[];
  }
  ```
- **Important backend behavior**:
  - If there is a `sumsub_applicant_id` and status is `pending` or `review`, the backend **polls SumSub** for the latest review status.
  - It then:
    - Logs detailed info (reject labels, moderation comment, etc.) to the server logs.
    - Updates the `kyc_verifications` row and user’s `kyc_status` accordingly.
    - Derives `rejection_reasons` from SumSub’s `buttonIds`, `rejectLabels` and moderation states.
- **Usage**:
  - `KycVerificationPage` uses it to short‑circuit to the next step if the user is already approved.
  - `VerificationStatusPage` uses it to show live status and reasons and to decide when to redirect.
  - `flow-router.service.ts` uses it when determining the next onboarding route.

#### 2.3 `getVerificationDetails(kycId)`

- **Purpose**: Fetch detailed information for a specific KYC verification (primarily for admin or debug UIs).
- **Frontend function**:
  - Signature:
    ```ts
    export async function getVerificationDetails(
      kycId: string
    ): Promise<VerificationDetails>;
    ```
- **Backend endpoint**:
  - Method: `GET`
  - Path: `/kyc/verification/:kycId`
  - Controller: `KycController.getVerificationDetails()`
- **Request**:
  - URL param: `kycId` – UUID of the `kyc_verifications` record.
- **Response type** (`VerificationDetails` from `src/lib/api/types/kyc.ts` – trimmed):
  ```ts
  export interface VerificationDetails {
    kyc_id: string;
    user_id: string;
    status: KycStatus;
    decision_reason?: string;
    liveness_result?: string;
    liveness_confidence?: number;
    face_match_score?: number;
    doc_authenticity_score?: number;
    created_at: string;
    updated_at?: string;
    user?: {
      user_id: string;
      email: string;
      username: string;
    };
    documents?: Array<{
      document_id: string;
      kyc_id: string;
      storage_url: string;
      document_type?: string;
      // ... more doc metadata
    }>;
    face_matches?: Array<{
      match_id: string;
      kyc_id: string;
      storage_url: string;
      liveness_result?: string;
      liveness_confidence?: number;
      // ... more face match metadata
    }>;
  }
  ```
- **Usage**:
  - Used in `flow-router.service.ts` to check whether documents and selfie exist for legacy flows.
  - Can be consumed by admin/debug pages when inspecting a user’s KYC record.

#### 2.4 `clearKycForRetry()` (optional helper)

> Note: this helper is only meaningful if you keep the **“Retry verification”** UX that explicitly clears documents and resets the applicant before redirecting back into the SDK. Whether you show that button depends on your product decision and SumSub’s guidance for your use case.

- **Purpose**: Clear all current KYC documents for the user and reset the linked SumSub applicant for a fresh submission.
- **Frontend function**:
  ```ts
  export async function clearKycForRetry(): Promise<{
    success: boolean;
    message: string;
    deleted_documents?: number;
    kyc_id?: string;
  }>;
  ```
- **Backend endpoint**:
  - Method: `POST`
  - Path: `/kyc/documents/clear`
  - Controller: `KycController.clearAllDocuments()`
- **Request**:
  - Authenticated, no body.
- **Backend behavior**:
  - Deletes all `kyc_documents` rows for the user’s current `kyc_verifications` record.
  - Calls `SumsubService.resetApplicant(applicantId)` if a `sumsub_applicant_id` exists.
  - Sets the verification `status` back to `pending` with a reason like _“Documents cleared, ready for resubmission”_.
- **Usage**:
  - Can be invoked from the verification status UI when `review_reject_type === "RETRY"` before redirecting the user back to `/onboarding/kyc-verification`.

#### 2.5 Legacy / deprecated functions

These exist in `src/lib/api/kyc.ts` for backward compatibility but are **not used** in the SumSub Web SDK flow:

- `uploadDocument(file, documentType, documentSide?)`  
  - Sends multipart upload to `/kyc/documents`.
  - Used by the old manual KYC flow (no longer recommended).
- `uploadSelfie(file)`  
  - Sends selfie upload to `/kyc/selfie`.
- `submitVerification()`  
  - `POST /kyc/submit` – used only by the legacy in‑house decision engine.

The Web SDK flow replaces those with **direct uploads to SumSub** inside the SDK iframe; the backend just orchestrates via applicant + access token + webhooks.

---

### 3. Frontend pages and how they use the APIs

#### 3.1 `KycVerificationPage` – `/onboarding/kyc-verification`

- File: `src/app/(auth)/onboarding/kyc-verification/page.tsx`
- Key behavior:
  1. Fetches current user via `getCurrentUser()`.
  2. If already KYC‑approved, delegates to the flow router and exits.
  3. Otherwise calls `getKycStatus()` once to:
     - See if SumSub is already processing (pending/review).
     - Potentially redirect straight to `/onboarding/verification-status`.
  4. If KYC not yet submitted, calls `getSdkToken()` and stores `accessToken`.
  5. Renders:
     ```tsx
     <SumsubWebSdk
       accessToken={accessToken}
       expirationHandler={handleAccessTokenExpiration}
       config={{ lang: "en", theme: "dark" }}
       options={{ addViewportTag: false, adaptIframeHeight: true }}
       onMessage={handleMessage}
       onError={handleError}
     />
     ```
  6. `onMessage` listens for events like `idCheck.onApplicantSubmitted` and navigates to `/onboarding/verification-status`.

#### 3.2 `VerificationStatusPage` – `/onboarding/verification-status`

- File: `src/app/(auth)/onboarding/verification-status/page.tsx`
- Key behavior:
  1. On mount, calls `getKycStatus()` once to fetch the current state.
  2. Starts a 10‑second polling loop while `status === "pending"` to keep the status in sync with SumSub (backend itself caches SumSub for 30 seconds).
  3. Uses the `KycStatusResponse` fields to:
     - Choose badge & progress bar state.
     - Show `decision_reason`.
     - Show `rejection_reasons` (if any) as list items.
     - Distinguish between:
       - `approved` → show “Verified” and let user continue.
       - `rejected` with `review_reject_type === "RETRY"` → resubmission UX.
       - `rejected` with `review_reject_type === "FINAL"` → contact support.
  4. When `status === "approved"`, calls `navigateToNextRoute()` to continue onboarding.

---

### 4. Summary

- The **only** direct KYC calls from the frontend in the Web SDK flow are:
  - `GET /kyc/sdk-token` → `getSdkToken()`
  - `GET /kyc/status` → `getKycStatus()`
  - Optionally: `POST /kyc/documents/clear` → `clearKycForRetry()`
  - (Admin/debug) `GET /kyc/verification/:kycId` → `getVerificationDetails()`
- All document and selfie capture + upload is handled **inside the SumSub SDK** using the access token; our backend never touches raw images in this flow (beyond any legacy paths you may still keep around).

