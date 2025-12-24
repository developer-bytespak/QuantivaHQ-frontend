"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { useState, useRef, useCallback, useEffect } from "react";
import { AUTH_STEPS } from "@/config/navigation";
import { uploadDocument } from "@/lib/api/kyc";
import { getCurrentUser } from "@/lib/api/user";
import { getKycStatus } from "@/lib/api/kyc";
import { exchangesService } from "@/lib/api/exchanges.service";

export default function ProofUploadPage() {
  const router = useRouter();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [animatedProgress, setAnimatedProgress] = useState(25);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState<string>("id_card");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Calculate target progress based on file upload
  const calculateTargetProgress = () => {
    // Always show 50% on this page (25% from personal info + 25% for reaching this page)
    return 50;
  };
  
  const targetProgress = calculateTargetProgress();

  // Check KYC status on mount - redirect if already approved
  useEffect(() => {
    const checkKycAndRedirect = async () => {
      try {
        // Check KYC status from user profile first
        const currentUser = await getCurrentUser();
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
        if (kycStatus === "approved") {
          const { navigateToNextRoute } = await import("@/lib/auth/flow-router.service");
          await navigateToNextRoute(router);
          return;
        }
      } catch (error) {
        // If check fails, continue with proof upload
        console.log("Could not verify KYC status, continuing with proof upload:", error);
      }
    };
    
    checkKycAndRedirect();
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

  // Check authentication on mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("quantivahq_is_authenticated") === "true";
    if (!isAuthenticated) {
      // User needs to authenticate first
      router.push("/onboarding/sign-up?tab=login");
    }
  }, [router]);

  // Load saved file from localStorage if available
  useEffect(() => {
    const savedFileData = localStorage.getItem("quantivahq_proof_upload");
    if (savedFileData) {
      try {
        const data = JSON.parse(savedFileData);
        // Preview is no longer stored (to avoid localStorage quota issues)
        // Just show that a file was uploaded by displaying metadata
        if (data.documentId) {
          // Set a placeholder file object to indicate file was uploaded
          setUploadedFile(new File([], data.fileName || "uploaded-file", { type: data.fileType || "image/jpeg" }));
          setDocumentId(data.documentId);
          // Don't set preview - user will need to re-upload if they come back to this page
        }
      } catch (e) {
        console.error("Failed to load saved proof upload", e);
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

    setUploadedFile(file);

    // Create preview using FileReader
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.onerror = () => {
        setError("Failed to read file. Please try again.");
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // For PDF, show a placeholder
      setPreview(null);
    }
  }, []);

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
    setUploadedFile(null);
    setPreview(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!uploadedFile) {
      setError("Please upload your ID document");
      return;
    }

    // Verify authentication (should already be checked on mount, but double-check)
    const isAuthenticated = localStorage.getItem("quantivahq_is_authenticated") === "true";
    if (!isAuthenticated) {
      setError("Authentication required. Please log in first.");
      router.push("/onboarding/sign-up?tab=login");
      return;
    }

    setIsLoading(true);

    try {
      // Upload document to backend
      const response = await uploadDocument(uploadedFile, documentType);
      
      // Store document ID for later use
      setDocumentId(response.document_id);
      
      // Store metadata only in localStorage (not the full preview to avoid quota issues)
      // Base64 previews can be 5MB+ which exceeds localStorage limits
      const fileData = {
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileType: uploadedFile.type,
        uploadDate: new Date().toISOString(),
        documentId: response.document_id,
        documentType: documentType,
      };
      localStorage.setItem("quantivahq_proof_upload", JSON.stringify(fileData));
      
      // Navigate to next step
      router.push("/onboarding/selfie-capture");
    } catch (err) {
      console.error("Document upload failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload document. Please try again."
      );
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
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full rounded-lg sm:rounded-xl border border-[--color-border] bg-[--color-surface] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#fc4f02] transition-colors"
            >
              <option value="id_card">National ID Card</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's License</option>
            </select>
          </div>

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
                        <p className="text-sm sm:text-base font-semibold text-[#10b981] mb-1.5 sm:mb-2">Upload Requirements</p>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center">
                      <ul className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-1.5 sm:space-y-2 w-full">
                        <li>• Acceptable formats: JPEG, PNG, WebP, or PDF</li>
                        <li>• Maximum file size: 10MB</li>
                        <li>• Ensure the document is clear and all text is readable</li>
                        <li>• Upload a valid government-issued ID (passport, driver's license, or national ID)</li>
                        <li>• The document must not be expired</li>
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
                {!uploadedFile ? (
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
                      {preview ? (
                        <div className="relative w-full h-full flex items-center justify-center p-2">
                          <img
                            src={preview}
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
                      ) : uploadedFile.type === 'application/pdf' ? (
                        <div 
                          onClick={() => setIsPreviewModalOpen(true)}
                          className="flex flex-col items-center justify-center p-3 sm:p-4 cursor-zoom-in w-full h-full absolute inset-0"
                        >
                          <div className="mb-2 sm:mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
                            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-[10px] sm:text-xs font-medium text-white mb-1 truncate max-w-full px-2">{uploadedFile.name}</p>
                          <p className="text-[9px] sm:text-xs text-slate-400">{formatFileSize(uploadedFile.size)}</p>
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
                            <p className="text-[10px] sm:text-xs font-semibold text-white truncate">{uploadedFile.name}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-400">{formatFileSize(uploadedFile.size)}</p>
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
            {isPreviewModalOpen && preview && (
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
                    src={preview}
                    alt="ID Document - Full View"
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-full max-h-[45vh] w-auto h-auto object-contain shadow-2xl"
                  />
                </div>
              </div>
            )}

            {/* PDF Preview Modal */}
            {isPreviewModalOpen && uploadedFile && uploadedFile.type === 'application/pdf' && (
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
                      <h3 className="text-sm font-semibold text-white mb-1.5 text-center truncate w-full px-2">{uploadedFile.name}</h3>
                      <p className="text-[10px] text-slate-400 mb-2">{formatFileSize(uploadedFile.size)}</p>
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
                disabled={isLoading || !uploadedFile}
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

