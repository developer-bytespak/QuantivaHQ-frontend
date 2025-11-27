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

