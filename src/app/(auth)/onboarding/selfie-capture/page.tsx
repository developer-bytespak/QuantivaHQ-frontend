"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { useState, useRef, useEffect, useCallback } from "react";
import { uploadSelfie } from "@/lib/api/kyc";
import { getCurrentUser } from "@/lib/api/user";
import { getKycStatus } from "@/lib/api/kyc";
import { exchangesService } from "@/lib/api/exchanges.service";
import { VerificationLoading } from "@/components/common/verification-loading";

export default function SelfieCapturePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt" | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState(50);
  const [showPermissionDialog, setShowPermissionDialog] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showVerificationLoading, setShowVerificationLoading] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

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
        // If check fails, continue with selfie capture
        console.log("Could not verify KYC status, continuing with selfie capture:", error);
      }
    };
    
    checkKycAndRedirect();
  }, [router]);

  // Animate progress bar to 75% when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(75);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Request camera access and start video stream
  const startCamera = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Front-facing camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      
      // Function to attach stream to video element
      const attachStreamToVideo = (video: HTMLVideoElement) => {
        video.srcObject = stream;
        
        // Set up event listeners to ensure video plays
        const handleLoadedMetadata = () => {
          video.play()
            .then(() => {
              setCameraPermission("granted");
              setIsLoading(false);
            })
            .catch((err) => {
              console.error("Error playing video after metadata loaded:", err);
              // Try one more time
              setTimeout(() => {
                if (videoRef.current && streamRef.current) {
                  videoRef.current.play()
                    .then(() => {
                      setCameraPermission("granted");
                      setIsLoading(false);
                    })
                    .catch((e) => {
                      console.error("Final retry failed:", e);
                      setCameraPermission("granted");
                      setIsLoading(false);
                    });
                }
              }, 200);
            });
        };

        const handleCanPlay = () => {
          if (video.paused) {
            video.play().catch((err) => {
              console.error("Error playing video on canplay:", err);
            });
          }
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        video.addEventListener('canplay', handleCanPlay, { once: true });
        
        // Also try to play immediately
        video.play()
          .then(() => {
            setCameraPermission("granted");
            setIsLoading(false);
          })
          .catch((err) => {
            // If immediate play fails, wait for loadedmetadata event
            console.log("Immediate play failed, waiting for metadata:", err);
          });
      };

      // Wait for video element to be ready
      if (videoRef.current) {
        attachStreamToVideo(videoRef.current);
      } else {
        // Video element not ready yet, wait a bit and try again
        const retryInterval = setInterval(() => {
          if (videoRef.current) {
            clearInterval(retryInterval);
            attachStreamToVideo(videoRef.current);
          }
        }, 50);

        // Stop retrying after 2 seconds
        setTimeout(() => {
          clearInterval(retryInterval);
          if (!videoRef.current) {
            setCameraPermission("granted");
            setIsLoading(false);
          }
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setIsLoading(false);
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Camera permission denied. Please allow camera access to continue.");
        setCameraPermission("denied");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No camera found. Please connect a camera and try again.");
      } else {
        setError("Failed to access camera. Please try again.");
      }
    }
  }, []);

  // Handle permission dialog actions
  const handleAllowEveryTime = async () => {
    setShowPermissionDialog(false);
    setIsLoading(true);
    await startCamera();
  };

  const handleAllowOnlyThisTime = async () => {
    setShowPermissionDialog(false);
    setIsLoading(true);
    await startCamera();
  };

  const handleDeny = () => {
    setShowPermissionDialog(false);
    setPermissionDenied(true);
    setCameraPermission("denied");
    setIsLoading(false);
    setError("Camera access is required to verify your identity. Please allow camera access to take a live selfie for verification.");
  };

  // Start camera when component mounts (only if permission dialog is not shown)
  useEffect(() => {
    if (!showPermissionDialog && !permissionDenied) {
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startCamera();
      }, 100);

      // Cleanup: stop camera stream when component unmounts
      return () => {
        clearTimeout(timer);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };
    }
  }, [showPermissionDialog, permissionDenied, startCamera]);

  // Ensure video plays when retaking (when capturedPhoto becomes null)
  useEffect(() => {
    if (!capturedPhoto && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      const stream = streamRef.current;
      
      // Check if stream is still active
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.readyState === 'live') {
        // Ensure video element has the stream
        if (video.srcObject !== stream) {
          video.srcObject = stream;
        }
        // Play the video
        video.play().catch((err) => {
          console.error("Error playing video after retake:", err);
        });
      } else {
        // Stream might have been stopped, restart camera
        startCamera();
      }
    }
  }, [capturedPhoto, startCamera]);

  // Ensure video plays when component mounts or video element becomes available
  useEffect(() => {
    const ensureVideoPlays = () => {
      if (videoRef.current && streamRef.current && !capturedPhoto) {
        const video = videoRef.current;
        const stream = streamRef.current;
        
        // Check if video already has the stream
        if (video.srcObject !== stream) {
          video.srcObject = stream;
        }
        
        // Ensure video is playing
        if (video.paused) {
          video.play().catch((err) => {
            console.error("Error playing video on mount:", err);
          });
        }
      }
    };

    // Try immediately
    ensureVideoPlays();
    
    // Also try after a short delay to handle cases where video element isn't ready yet
    const timeoutId = setTimeout(ensureVideoPlays, 200);
    
    return () => clearTimeout(timeoutId);
  }, [capturedPhoto]);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob, then to data URL
    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCapturedPhoto(reader.result as string);
          setIsCapturing(false);
        };
        reader.readAsDataURL(blob);
      }
    }, "image/jpeg", 0.95);
  }, []);

  // Handle capture button click
  const handleCapture = () => {
    setIsCapturing(true);
    // Small delay to ensure video is ready
    setTimeout(() => {
      capturePhoto();
    }, 100);
  };

  // Handle retake
  const handleRetake = () => {
    setCapturedPhoto(null);
    setIsCapturing(false);
    setError("");
    
    // Ensure video stream is active and playing
    if (videoRef.current && streamRef.current) {
      // Check if stream tracks are still active
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack && videoTrack.readyState === 'live') {
        // Stream is still active, just resume video playback
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch((err) => {
          console.error("Error playing video:", err);
        });
      } else {
        // Stream might have been stopped, restart camera
        startCamera();
      }
    } else if (!streamRef.current) {
      // No stream available, restart camera
      startCamera();
    }
  };

  // Convert data URL to File
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!capturedPhoto) {
      setError("Please capture a photo first");
      return;
    }

    // Show full-screen verification loading
    setShowVerificationLoading(true);
    setError("");

    try {
      // Convert data URL to File
      const selfieFile = dataURLtoFile(capturedPhoto, "selfie.jpg");

      // Upload selfie to backend (triggers liveness detection and face matching)
      await uploadSelfie(selfieFile);

      // Store selfie in localStorage as fallback
      const idDocumentData = localStorage.getItem("quantivahq_proof_upload");
      const selfieData = {
        photo: capturedPhoto,
        captureDate: new Date().toISOString(),
        idDocument: idDocumentData ? JSON.parse(idDocumentData) : null,
      };
      localStorage.setItem("quantivahq_selfie", JSON.stringify(selfieData));

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Mark verification as complete - this will trigger 100% progress animation
      setVerificationComplete(true);
      
      // Wait for the completion animation to show, then navigate
      setTimeout(() => {
        router.push("/onboarding/verification-status");
      }, 800); // 800ms to show the 100% completion
    } catch (err) {
      console.error("Selfie upload failed:", err);
      setShowVerificationLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload selfie. Please try again."
      );
    }
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Verification Loading Screen */}
      {showVerificationLoading && (
        <VerificationLoading 
          capturedImage={capturedPhoto || undefined} 
          isComplete={verificationComplete}
        />
      )}

      {/* Background matching Figma design */}
      <div className="absolute inset-0 bg-black">
        {/* Subtle gradient orbs for depth */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Permission Dialog */}
      {showPermissionDialog && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-6 sm:p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
                  <svg className="h-8 w-8 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Camera Access Required</h2>
              <p className="text-sm text-slate-400">
                We need access to your camera to take a live selfie for identity verification.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAllowEveryTime}
                className="w-full rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40"
              >
                Allow Every Time
              </button>
              <button
                onClick={handleAllowOnlyThisTime}
                className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]"
              >
                Allow Only This Time
              </button>
              <button
                onClick={handleDeny}
                className="w-full rounded-xl border-2 border-red-500/50 bg-red-500/10 px-6 py-3 text-sm font-semibold text-red-400 transition-all duration-300 hover:border-red-500 hover:bg-red-500/20"
              >
                Deny
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-y-auto px-3 pt-3 pb-3 sm:px-4 sm:pt-4 sm:pb-4 md:px-6 md:pt-6 md:pb-6 lg:px-8">
        <div className="w-full max-w-4xl py-4">
          {/* Header Section */}
          <div className="mb-3 sm:mb-4 text-center">
            <div className="mb-1.5 sm:mb-2 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            </div>
            <h1 className="mb-1 text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl animate-text-enter" style={{ animationDelay: "0.2s" }}>
              Take a <span className="text-white">Live Selfie</span>
            </h1>
            <p className="mx-auto max-w-xl text-[10px] sm:text-xs text-slate-400 md:text-sm animate-text-enter" style={{ animationDelay: "0.4s" }}>
              Please take a clear selfie to verify your identity. Make sure your face is clearly visible and well-lit.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-3 sm:mb-4 animate-text-enter" style={{ animationDelay: "0.5s" }}>
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

          {/* Camera Section */}
          <div className="animate-text-enter" style={{ animationDelay: "0.6s" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Left Side - Selfie Requirements */}
              <div className="group relative rounded-xl sm:rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-3 sm:p-4 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/30 hover:shadow-[#fc4f02]/10 flex flex-col min-h-[250px] sm:min-h-[300px] md:min-h-[350px]">
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
                        <p className="text-sm sm:text-base font-semibold text-[#10b981] mb-1.5 sm:mb-2">Selfie Requirements</p>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center">
                      <ul className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-1.5 sm:space-y-2 w-full">
                        <li>• Look directly at the camera</li>
                        <li>• Ensure good lighting</li>
                        <li>• Remove glasses or hat if possible</li>
                        <li>• Keep a neutral expression</li>
                        <li>• Make sure your entire face is visible</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Camera View */}
              <div className="group relative rounded-xl sm:rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-3 sm:p-4 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/30 hover:shadow-[#fc4f02]/10 overflow-hidden flex flex-col min-h-[250px] sm:min-h-[300px] md:min-h-[350px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#fc4f02]/5 via-transparent to-[#fda300]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10 flex flex-col flex-1 min-h-0">
                  {/* Camera View / Preview */}
                  <div className="relative rounded-lg sm:rounded-xl border-2 border-[--color-border] bg-[--color-surface] overflow-hidden flex items-center justify-center flex-1 min-h-[150px] sm:min-h-[180px] md:min-h-[200px] w-full">
                  {/* Always render video element so stream can be attached */}
                  {!capturedPhoto && (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                      onLoadedMetadata={() => {
                        // Ensure video plays when metadata is loaded
                        if (videoRef.current && videoRef.current.paused) {
                          videoRef.current.play().catch((err) => {
                            console.error("Error playing video on metadata load:", err);
                          });
                        }
                      }}
                      onCanPlay={() => {
                        // Ensure video plays when it can play
                        if (videoRef.current && videoRef.current.paused) {
                          videoRef.current.play().catch((err) => {
                            console.error("Error playing video on canplay:", err);
                          });
                        }
                      }}
                    />
                  )}

                  {isLoading && !capturedPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[--color-surface]/80 backdrop-blur-sm z-10">
                      <div className="text-center">
                        <svg className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-2 sm:mb-3 text-[#fc4f02] animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-xs sm:text-sm text-slate-400">Accessing camera...</p>
                      </div>
                    </div>
                  )}

                  {error && !capturedPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[--color-surface]/90 backdrop-blur-sm z-10 p-4 sm:p-6">
                      <div className="text-center max-w-md">
                        <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto items-center justify-center rounded-xl bg-red-500/20">
                          <svg className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-red-400 mb-3 sm:mb-4 px-2">{error}</p>
                        {permissionDenied && (
                          <button
                            onClick={() => {
                              setPermissionDenied(false);
                              setShowPermissionDialog(true);
                              setError("");
                            }}
                            className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105"
                          >
                            Grant Permission
                          </button>
                        )}
                        {cameraPermission === "denied" && !permissionDenied && (
                          <button
                            onClick={() => {
                              setShowPermissionDialog(true);
                              setError("");
                            }}
                            className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105"
                          >
                            Try Again
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {!capturedPhoto && !isLoading && !error && (
                    <>
                      {/* Camera overlay guide */}
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 sm:w-40 sm:h-52 md:w-48 md:h-64 border-2 border-white/50 rounded-lg" />
                      </div>
                    </>
                  )}

                  {capturedPhoto && (
                    <img
                      src={capturedPhoto}
                      alt="Captured selfie"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  )}

                  {/* Hidden canvas for capturing */}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Action Buttons */}
                <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center flex-shrink-0">
                  {!capturedPhoto ? (
                    <button
                      onClick={handleCapture}
                      disabled={isLoading || !!error || !cameraPermission}
                      className="group relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {isCapturing ? "Capturing..." : "Capture Photo"}
                      </span>
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleRetake}
                        className="rounded-lg sm:rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-4 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-white transition-all duration-300 hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]"
                      >
                        Retake
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={showVerificationLoading}
                        className="group relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                          Verify Identity
                          <svg className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      </button>
                    </>
                  )}
                </div>

                {/* Error Message */}
                {error && capturedPhoto && (
                  <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-500/5 px-2 sm:px-3 py-1.5 sm:py-2 backdrop-blur flex-shrink-0">
                    <div className="flex h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/20">
                      <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-medium text-red-400">{error}</p>
                  </div>
                )}

                <p className="mt-2 sm:mt-3 text-center text-[9px] sm:text-[10px] text-slate-400 flex-shrink-0 px-2">
                  Your selfie will be compared with your ID document for verification
                </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

