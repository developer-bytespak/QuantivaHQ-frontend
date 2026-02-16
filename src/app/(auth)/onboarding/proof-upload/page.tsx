"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { useState, useRef, useCallback, useEffect } from "react";
import { AUTH_STEPS } from "@/config/navigation";
import { uploadDocument, getDocumentStatus } from "@/lib/api/kyc";
import { getCurrentUser } from "@/lib/api/user";
import { getKycStatus } from "@/lib/api/kyc";
import { exchangesService } from "@/lib/api/exchanges.service";

// Document requirements configuration
const DOCUMENT_REQUIREMENTS = {
  passport: { sides: 1, requiresBack: false, label: "Passport" },
  id_card: { sides: 2, requiresBack: true, label: "National ID Card" },
  drivers_license: { sides: 2, requiresBack: true, label: "Driver's License" },
} as const;

type DocumentSide = 'front' | 'back';

interface DocumentUploadState {
  file: File | null;
  preview: string | null;
  documentId: string | null;
}

export default function ProofUploadPage() {
  const router = useRouter();
  
  // Document upload state for front and back
  const [frontUpload, setFrontUpload] = useState<DocumentUploadState>({
    file: null,
    preview: null,
    documentId: null,
  });
  const [backUpload, setBackUpload] = useState<DocumentUploadState>({
    file: null,
    preview: null,
    documentId: null,
  });
  
  const [currentSide, setCurrentSide] = useState<DocumentSide>('front');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [animatedProgress, setAnimatedProgress] = useState(25);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState<string>("id_card");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Get current upload state based on selected side
  const currentUpload = currentSide === 'front' ? frontUpload : backUpload;
  const setCurrentUpload = currentSide === 'front' ? setFrontUpload : setBackUpload;
  
  // Get document requirements for current type
  const documentReq = DOCUMENT_REQUIREMENTS[documentType as keyof typeof DOCUMENT_REQUIREMENTS] || DOCUMENT_REQUIREMENTS.id_card;

  // Calculate target progress based on file upload
  const calculateTargetProgress = () => {
    // Count uploaded sides
    const uploadedSides = (frontUpload.file ? 1 : 0) + (backUpload.file ? 1 : 0);
    const requiredSides = documentReq.sides;
    
    // Base 25% from personal info + 25% for this step + bonus for uploads
    return 50 + (uploadedSides / requiredSides) * 25;
  };
  
  const targetProgress = calculateTargetProgress();

  // Check authentication and KYC status on mount - consolidated to avoid redirect loops
  useEffect(() => {
    let isMounted = true;
    
    const checkAuthAndKyc = async () => {
      try {
        // Check KYC status from user profile - this also validates authentication
        const currentUser = await getCurrentUser();
        
        if (!isMounted) return;
        
        let kycStatus: "pending" | "approved" | "rejected" | "review" | null | undefined = currentUser.kyc_status;
        
        // If not approved from profile, check detailed KYC endpoint
        if (kycStatus !== "approved") {
          try {
            const kycResponse = await getKycStatus();
            kycStatus = kycResponse.status;
          } catch (kycError) {
            // If KYC endpoint fails, use profile status or continue
            console.log("Could not get detailed KYC status:", kycError);
          }
        }
        
        // If KYC is approved, use flow router to determine next step
        if (kycStatus === "approved" && isMounted) {
          const { navigateToNextRoute } = await import("@/lib/auth/flow-router.service");
          await navigateToNextRoute(router);
          return;
        }
      } catch (error: any) {
        // If getCurrentUser fails with 401, user is not authenticated - redirect to login
        if (error?.status === 401 || error?.statusCode === 401 || 
            error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
          if (isMounted) {
            router.push("/onboarding/sign-up?tab=login");
          }
        } else {
          // Other error - log but allow user to continue
          console.log("Could not verify KYC status, continuing with proof upload:", error);
        }
      }
    };
    
    checkAuthAndKyc();
    
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Animate progress bar when component mounts or when file is uploaded
  useEffect(() => {
    // Start animation after a small delay
    const timer = setTimeout(() => {
      setAnimatedProgress(targetProgress);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [targetProgress]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPreviewModalOpen(false);
      }
    };

    if (isPreviewModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isPreviewModalOpen]);

  // Load saved files from localStorage if available
  useEffect(() => {
    const savedFrontData = localStorage.getItem("quantivahq_proof_upload_front");
    const savedBackData = localStorage.getItem("quantivahq_proof_upload_back");
    
    if (savedFrontData) {
      try {
        const data = JSON.parse(savedFrontData);
        if (data.documentId) {
          setFrontUpload({
            file: new File([], data.fileName || "uploaded-file-front", { type: data.fileType || "image/jpeg" }),
            preview: null,
            documentId: data.documentId,
          });
        }
      } catch (e) {
        console.error("Failed to load saved front upload", e);
      }
    }
    
    if (savedBackData) {
      try {
        const data = JSON.parse(savedBackData);
        if (data.documentId) {
          setBackUpload({
            file: new File([], data.fileName || "uploaded-file-back", { type: data.fileType || "image/jpeg" }),
            preview: null,
            documentId: data.documentId,
          });
        }
      } catch (e) {
        console.error("Failed to load saved back upload", e);
      }
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    setError("");
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image (JPEG, PNG, WebP) or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }

    // Create preview using FileReader
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentUpload({
          file,
          preview: reader.result as string,
          documentId: null,
        });
      };
      reader.onerror = () => {
        setError("Failed to read file. Please try again.");
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // For PDF, no preview
      setCurrentUpload({
        file,
        preview: null,
        documentId: null,
      });
    }
  }, [setCurrentUpload]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleRemoveFile = () => {
    setCurrentUpload({
      file: null,
      preview: null,
      documentId: null,
    });
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate that front is uploaded
    if (!frontUpload.file) {
      setError("Please upload the front side of your document");
      setCurrentSide('front');
      return;
    }

    // Validate that back is uploaded if required
    if (documentReq.requiresBack && !backUpload.file) {
      setError("Please upload the back side of your document");
      setCurrentSide('back');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[Proof Upload] Starting document upload...');
      console.log('[Proof Upload] Document type:', documentType);
      console.log('[Proof Upload] Front file:', frontUpload.file?.name, 'Already uploaded:', !!frontUpload.documentId);
      console.log('[Proof Upload] Back file:', backUpload.file?.name, 'Already uploaded:', !!backUpload.documentId);
      
      // Upload front side if not already uploaded
      if (frontUpload.file && !frontUpload.documentId) {
        console.log('[Proof Upload] 📤 Uploading FRONT side to backend...');
        const frontResponse = await uploadDocument(frontUpload.file, documentType, 'front');
        console.log('[Proof Upload] ✅ Front uploaded successfully, document_id:', frontResponse.document_id);
        setFrontUpload(prev => ({ ...prev, documentId: frontResponse.document_id }));
        
        // Store front metadata
        const frontData = {
          fileName: frontUpload.file.name,
          fileSize: frontUpload.file.size,
          fileType: frontUpload.file.type,
          uploadDate: new Date().toISOString(),
          documentId: frontResponse.document_id,
          documentType: documentType,
          side: 'front',
        };
        localStorage.setItem("quantivahq_proof_upload_front", JSON.stringify(frontData));
      }
      
      // Upload back side if required and not already uploaded
      if (documentReq.requiresBack && backUpload.file && !backUpload.documentId) {
        console.log('[Proof Upload] 📤 Uploading BACK side to backend...');
        const backResponse = await uploadDocument(backUpload.file, documentType, 'back');
        console.log('[Proof Upload] ✅ Back uploaded successfully, document_id:', backResponse.document_id);
        setBackUpload(prev => ({ ...prev, documentId: backResponse.document_id }));
        
        // Store back metadata
        const backData = {
          fileName: backUpload.file.name,
          fileSize: backUpload.file.size,
          fileType: backUpload.file.type,
          uploadDate: new Date().toISOString(),
          documentId: backResponse.document_id,
          documentType: documentType,
          side: 'back',
        };
        localStorage.setItem("quantivahq_proof_upload_back", JSON.stringify(backData));
      }
      
      console.log('[Proof Upload] ✅ All uploads complete! Navigating to selfie-capture...');
      
      // Navigate to next step
      router.push("/onboarding/selfie-capture");
    } catch (err: any) {
      console.error("Document upload failed:", err);
      
      // Check if error is due to authentication failure
      if (err?.status === 401 || err?.statusCode === 401 || 
          err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
        setError("Your session has expired. Please log in again.");
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/onboarding/sign-up?tab=login");
        }, 1500);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to upload document. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Background matching Figma design */}
      <div className="absolute inset-0 bg-black">
        {/* Subtle gradient orbs for depth */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-y-auto px-3 pt-3 pb-4 sm:px-4 sm:pt-4 sm:pb-6 md:px-6 md:pt-6 md:pb-8 lg:px-8">
        <div className="w-full max-w-6xl flex flex-col flex-1 min-h-0 py-4">
          {/* Header Section */}
          <div className="mb-2 sm:mb-3 flex-shrink-0 text-center">
            <div className="mb-1.5 sm:mb-2 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14" />
            </div>
            <h1 className="mb-1 text-lg sm:text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl animate-text-enter" style={{ animationDelay: "0.2s" }}>
              Upload <span className="text-white">ID Document</span>
            </h1>
            <p className="mx-auto max-w-xl text-[10px] sm:text-xs text-slate-400 md:text-sm animate-text-enter" style={{ animationDelay: "0.4s" }}>
              Please upload a clear photo or scan of your government-issued ID card or passport for verification.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-2 sm:mb-3 flex-shrink-0 animate-text-enter" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1.5 sm:mb-2">
              <span className="text-slate-400 font-medium">Progress</span>
              <span className="font-bold text-white">{Math.round(animatedProgress)}%</span>
            </div>
            <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-white/10 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#fc4f02] to-[#fda300] transition-all duration-1000 ease-out shadow-lg shadow-[#fc4f02]/50 rounded-full"
                style={{ width: `${animatedProgress}%` }}
              />
            </div>
          </div>

          {/* Document Type Selector */}
          <div className="mb-3 sm:mb-4 animate-text-enter" style={{ animationDelay: "0.55s" }}>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => {
                setDocumentType(e.target.value);
                // Reset uploads when document type changes
                setFrontUpload({ file: null, preview: null, documentId: null });
                setBackUpload({ file: null, preview: null, documentId: null });
                setCurrentSide('front');
              }}
              className="w-5/6 sm:w-full rounded-lg sm:rounded-xl border border-[--color-border] bg-[--color-surface] px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#fc4f02] transition-colors"
            >
              <option value="id_card">National ID Card (2 sides required)</option>
              <option value="passport">Passport (1 side required)</option>
              <option value="drivers_license">Driver's License (2 sides required)</option>
            </select>
          </div>

          {/* Document Side Tabs (only show for multi-sided documents) */}
          {documentReq.requiresBack && (
            <div className="mb-3 sm:mb-4 animate-text-enter" style={{ animationDelay: "0.57s" }}>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentSide('front')}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    currentSide === 'front'
                      ? 'bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg'
                      : 'bg-[--color-surface] text-slate-400 border border-[--color-border] hover:border-[#fc4f02]/50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    Front Side
                    {frontUpload.file && (
                      <svg className="h-4 w-4 text-[#10b981]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSide('back')}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    currentSide === 'back'
                      ? 'bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg'
                      : 'bg-[--color-surface] text-slate-400 border border-[--color-border] hover:border-[#fc4f02]/50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    Back Side
                    {backUpload.file && (
                      <svg className="h-4 w-4 text-[#10b981]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                </button>
              </div>

              {/* Upload Status Indicator for multi-sided documents */}
              <div className="mt-2 rounded-lg border border-[--color-border] bg-[--color-surface]/60 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0">
                    {frontUpload.file && backUpload.file ? (
                      <svg className="h-5 w-5 text-[#10b981]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white mb-1">
                      {frontUpload.file && backUpload.file 
                        ? '✓ Both sides uploaded - Ready to submit!' 
                        : 'Upload both sides required'}
                    </p>
                    <ul className="text-[10px] text-slate-400 space-y-0.5">
                      <li className="flex items-center gap-1.5">
                        {frontUpload.file ? (
                          <span className="text-[#10b981]">✓ Front uploaded</span>
                        ) : (
                          <span className="text-yellow-500">○ Front needed</span>
                        )}
                      </li>
                      <li className="flex items-center gap-1.5">
                        {backUpload.file ? (
                          <span className="text-[#10b981]">✓ Back uploaded</span>
                        ) : (
                          <span className="text-yellow-500">○ Back needed</span>
                        )}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="animate-text-enter flex-1 flex flex-col" style={{ animationDelay: "0.6s" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 flex-1 min-h-0">
              {/* Left Side - Upload Requirements */}
              <div className="group relative rounded-xl sm:rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-3 sm:p-4 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/30 hover:shadow-[#fc4f02]/10 flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-[#fc4f02]/5 via-transparent to-[#fda300]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="rounded-lg sm:rounded-xl border border-[#10b981]/30 bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5 p-3 sm:p-4 backdrop-blur flex-1 flex flex-col">
                    <div className="flex items-start gap-2 sm:gap-3 flex-shrink-0">
                      <div className="flex h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#10b981]/20">
                        <svg className="h-3 w-3 sm:h-4 sm:w-4 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm sm:text-base font-semibold text-[#10b981] mb-1.5 sm:mb-2">
                          Upload Requirements {documentReq.requiresBack && `(${currentSide === 'front' ? 'Front' : 'Back'} Side)`}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center">
                      <ul className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-1.5 sm:space-y-2 w-full">
                        <li>• Document: {documentReq.label}</li>
                        <li>• Required sides: {documentReq.sides} {documentReq.requiresBack ? '(front & back)' : '(photo page only)'}</li>
                        <li>• Formats: JPEG, PNG, WebP, or PDF</li>
                        <li>• Maximum file size: 10MB</li>
                        <li>• Ensure all text is clearly readable</li>
                        <li>• Document must not be expired</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - File Upload Area */}
              <div className="group relative rounded-xl sm:rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-3 sm:p-4 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/30 hover:shadow-[#fc4f02]/10 overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-[#fc4f02]/5 via-transparent to-[#fda300]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10 flex flex-col flex-1 min-h-0">
                  {/* File Upload Area */}
                {!currentUpload.file ? (
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center h-[200px] sm:h-[220px] md:h-[240px] ${
                      isDragging
                        ? "border-[#fc4f02] bg-[#fc4f02]/10 scale-[1.02]"
                        : "border-[--color-border] bg-[--color-surface]/40 hover:border-[#fc4f02]/50 hover:bg-[--color-surface]/60"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 text-center">
                      <div className="mb-2 sm:mb-3 flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
                        <svg className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <h3 className="mb-1 sm:mb-1.5 sm:mb-2 text-sm sm:text-base font-semibold text-white px-2">
                        {isDragging ? "Drop your file here" : "Drag & drop your ID document"}
                      </h3>
                      <p className="mb-2 sm:mb-3 text-xs sm:text-sm text-slate-400 px-2">
                        or <span className="text-[#fc4f02] font-medium">browse files</span>
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 px-2">
                        Supported formats: JPEG, PNG, WebP, PDF (Max 10MB)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 min-h-0 space-y-2 sm:space-y-3">
                    {/* File Preview */}
                    <div className="relative rounded-lg sm:rounded-xl border-2 border-[--color-border] bg-[--color-surface] overflow-hidden flex items-center justify-center h-[200px] sm:h-[220px] md:h-[240px]">
                      {currentUpload.preview ? (
                        <div className="relative w-full h-full flex items-center justify-center p-2">
                          <img
                            src={currentUpload.preview}
                            alt="ID Preview"
                            onClick={() => setIsPreviewModalOpen(true)}
                            className="max-w-full max-h-full w-auto h-auto object-contain cursor-zoom-in transition-transform duration-200 hover:scale-105"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile();
                            }}
                            className="absolute top-2 right-2 sm:top-3 sm:right-3 flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-red-500/90 text-white shadow-lg transition-all duration-200 hover:bg-red-500 hover:scale-110 z-10"
                          >
                            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : currentUpload.file && currentUpload.file.type === 'application/pdf' ? (
                        <div 
                          onClick={() => setIsPreviewModalOpen(true)}
                          className="flex flex-col items-center justify-center p-3 sm:p-4 cursor-zoom-in w-full h-full absolute inset-0"
                        >
                          <div className="mb-2 sm:mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
                            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-[10px] sm:text-xs font-medium text-white mb-1 truncate max-w-full px-2">{currentUpload.file.name}</p>
                          <p className="text-[9px] sm:text-xs text-slate-400">{formatFileSize(currentUpload.file.size)}</p>
                        </div>
                      ) : null}
                    </div>

                    {/* File Info */}
                    <div className="rounded-lg sm:rounded-xl border border-[#10b981]/30 bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5 p-2.5 sm:p-3 flex-shrink-0">
                      <div className="flex items-center justify-between gap-2 sm:gap-3">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                          <div className="flex h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#10b981]/20">
                            <svg className="h-3 w-3 sm:h-4 sm:w-4 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-xs font-semibold text-white truncate">{currentUpload.file.name}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-400">{formatFileSize(currentUpload.file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-lg border border-[--color-border] bg-[--color-surface] px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-medium text-white transition-colors hover:border-[#fc4f02] hover:bg-[--color-surface-alt] flex-shrink-0"
                        >
                          Change
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                  {/* Error Message */}
                  {error && (
                    <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-500/5 px-3 sm:px-4 py-2 sm:py-3 backdrop-blur">
                      <div className="flex h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/20">
                        <svg className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-[10px] sm:text-xs font-medium text-red-400">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Modal Overlay */}
            {isPreviewModalOpen && currentUpload.preview && (
              <div 
                className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                <div className="relative w-full max-w-lg max-h-[45vh] flex items-center justify-center">
                  <button
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-white transition-all duration-200 hover:bg-black hover:scale-110 z-10 backdrop-blur-sm shadow-lg"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <img
                    src={currentUpload.preview}
                    alt="ID Document - Full View"
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-full max-h-[45vh] w-auto h-auto object-contain shadow-2xl"
                  />
                </div>
              </div>
            )}

            {/* PDF Preview Modal */}
            {isPreviewModalOpen && currentUpload.file && currentUpload.file.type === 'application/pdf' && (
              <div 
                className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                <div className="relative w-full max-w-xs">
                  <button
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-white transition-all duration-200 hover:bg-black hover:scale-110 z-10 backdrop-blur-sm shadow-lg"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div 
                    className="relative rounded-xl bg-[#0f172a] shadow-2xl p-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
                        <svg className="h-6 w-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1.5 text-center truncate w-full px-2">{currentUpload.file.name}</h3>
                      <p className="text-[10px] text-slate-400 mb-2">{formatFileSize(currentUpload.file.size)}</p>
                      <p className="text-[10px] text-slate-500 text-center">
                        PDF preview is not available. Please download the file to view it.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-3 sm:mt-4 flex-shrink-0 text-center">
              <button
                type="submit"
                disabled={isLoading || !frontUpload.file || (documentReq.requiresBack && !backUpload.file)}
                className="group relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 sm:px-8 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      Continue
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
              <p className="mt-3 mb-4 sm:mb-6 text-xs text-slate-400">
                Your document is encrypted and securely stored
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

