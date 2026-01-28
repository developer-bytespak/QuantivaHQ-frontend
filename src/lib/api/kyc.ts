/**
 * KYC API Service
 * Centralized functions for KYC operations
 */
import { apiRequest, uploadFile } from "./client";
import type {
  DocumentUploadResponse,
  KycStatusResponse,
  VerificationDetails,
} from "./types/kyc";

/**
 * Upload ID document for KYC verification
 */
export async function uploadDocument(
  file: File,
  documentType: string
): Promise<DocumentUploadResponse> {
  return uploadFile<DocumentUploadResponse>({
    path: "/kyc/documents",
    file,
    additionalData: {
      document_type: documentType,
    },
  });
}

/**
 * Upload selfie for liveness detection and face matching
 * Uses extended timeout (3 minutes) due to ML processing for:
 * - Liveness detection (anti-spoofing)
 * - Face matching against ID document
 */
export async function uploadSelfie(file: File): Promise<void> {
  await uploadFile({
    path: "/kyc/selfie",
    file,
    timeout: 180000, // 3 minutes for ML-based liveness detection and face matching
  });
}

/**
 * Submit complete KYC verification
 */
export async function submitVerification(): Promise<void> {
  await apiRequest<void, void>({
    path: "/kyc/submit",
    method: "POST",
  });
}

/**
 * Get current KYC status for the authenticated user
 */
export async function getKycStatus(): Promise<KycStatusResponse> {
  return apiRequest<void, KycStatusResponse>({
    path: "/kyc/status",
    method: "GET",
  });
}

/**
 * Get detailed verification information by KYC ID
 */
export async function getVerificationDetails(
  kycId: string
): Promise<VerificationDetails> {
  return apiRequest<void, VerificationDetails>({
    path: `/kyc/verification/${kycId}`,
    method: "GET",
  });
}

