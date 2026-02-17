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
 * @param file - The file to upload
 * @param documentType - Type of document ('passport' | 'id_card' | 'drivers_license')
 * @param documentSide - Side of document ('front' | 'back') - optional for passport
 */
export async function uploadDocument(
  file: File,
  documentType: string,
  documentSide?: string
): Promise<DocumentUploadResponse> {
  return uploadFile<DocumentUploadResponse>({
    path: "/kyc/documents",
    file,
    additionalData: {
      document_type: documentType,
      ...(documentSide && { document_side: documentSide }),
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

/**
 * Check document upload status for a specific document type
 * @param documentType - Type of document ('passport' | 'id_card' | 'drivers_license')
 */
export async function getDocumentStatus(
  documentType: string
): Promise<{ frontUploaded: boolean; backUploaded: boolean; isComplete: boolean }> {
  return apiRequest<void, { frontUploaded: boolean; backUploaded: boolean; isComplete: boolean }>({
    path: `/kyc/documents/status/${documentType}`,
    method: "GET",
  });
}

/**
 * Check if all required document sides are uploaded before proceeding
 */
export async function checkDocumentCompleteness(): Promise<{
  isComplete: boolean;
  missingDocuments: Array<{ type: string; missing: string[] }>;
}> {
  return apiRequest<void, {
    isComplete: boolean;
    missingDocuments: Array<{ type: string; missing: string[] }>;
  }>({
    path: "/kyc/documents/completeness",
    method: "GET",
  });
}


