/**
 * Type definitions for KYC API responses
 * These match the backend response interfaces
 */

export type KycStatus = "pending" | "approved" | "rejected" | "review";

export interface DocumentUploadResponse {
  success: boolean;
  document_id: string;
  message: string;
}

export interface KycStatusResponse {
  status: KycStatus;
  kyc_id: string | null;
  decision_reason?: string;
  liveness_result?: string;
  liveness_confidence?: number;
  face_match_score?: number;
  doc_authenticity_score?: number;
  /** Sumsub rejection type: "RETRY" (temporary, user can resubmit) or "FINAL" (permanent) */
  review_reject_type?: "RETRY" | "FINAL" | null;
  /** Human-readable rejection reasons from Sumsub */
  rejection_reasons?: string[];
  /** Raw Sumsub review status ("init", "pending", "onHold", "completed") */
  sumsub_review_status?: string | null;
  /**
   * True only when Sumsub has actually received docs + selfie from the user.
   * False for newly-created applicants that haven't completed the SDK flow
   * (so the frontend knows to send them back to the SDK page rather than
   * trapping them on a pending spinner).
   */
  has_submission?: boolean;
}

export interface VerificationDetails {
  kyc_id: string;
  user_id: string;
  status: KycStatus;
  decision_reason?: string;
  liveness_result?: string;
  liveness_confidence?: number;
  face_match_score?: number;
  doc_authenticity_score?: number;
  mrz_data?: Record<string, unknown>;
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
    ocr_name?: string;
    ocr_dob?: string;
    ocr_confidence?: number;
    mrz_text?: string;
    authenticity_flags?: Record<string, unknown>;
    expiration_date?: string;
    issuing_country?: string;
  }>;
  face_matches?: Array<{
    match_id: string;
    kyc_id: string;
    storage_url: string;
    liveness_result?: string;
    liveness_confidence?: number;
    quality_score?: number;
    spoof_type?: string;
  }>;
}

