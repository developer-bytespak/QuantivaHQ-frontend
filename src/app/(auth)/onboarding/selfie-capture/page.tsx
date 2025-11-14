"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { BackButton } from "@/components/common/back-button";
import { useState, useRef, useEffect, useCallback } from "react";

export default function SelfieCapturePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt" | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState(50);

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
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCameraPermission("granted");
      setIsLoading(false);
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

  // Start camera when component mounts
  useEffect(() => {
    startCamera();

    // Cleanup: stop camera stream when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera]);

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
      }
    }
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

  // Handle submit
  const handleSubmit = async () => {
    if (!capturedPhoto) {
      setError("Please capture a photo first");
      return;
    }

    setIsLoading(true);

    // Get the ID document from previous step for verification
    const idDocumentData = localStorage.getItem("quantivahq_proof_upload");
    
    // Store selfie in localStorage
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

    // Simulate face verification API call
    // In production, this would send both images to a backend service for face matching
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to verification status page
      router.push("/onboarding/verification-status");
    }, 2000);
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <BackButton />
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b0f19] via-[#1a1f2e] to-[#0b0f19]">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#1d4ed8]/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#10b981]/10 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-start overflow-y-auto px-4 pt-6 pb-6 sm:px-6 sm:pt-8 sm:pb-8 lg:px-8">
        <div className="w-full max-w-4xl">
          {/* Header Section */}
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-10 w-10 md:h-12 md:w-12" />
            </div>
            <h1 className="mb-2 text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl animate-text-enter" style={{ animationDelay: "0.2s" }}>
              Take a <span className="text-[#FF6B35]">Live Selfie</span>
            </h1>
            <p className="mx-auto max-w-xl text-xs text-slate-400 md:text-sm animate-text-enter" style={{ animationDelay: "0.4s" }}>
              Please take a clear selfie to verify your identity. Make sure your face is clearly visible and well-lit.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 animate-text-enter" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">Progress</span>
              <span className="font-bold text-white">{Math.round(animatedProgress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] transition-all duration-1000 ease-out shadow-lg shadow-[#FF6B35]/50 rounded-full"
                style={{ width: `${animatedProgress}%` }}
              />
            </div>
          </div>

          {/* Camera Section */}
          <div className="animate-text-enter" style={{ animationDelay: "0.6s" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Selfie Requirements */}
              <div className="group relative rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#FF6B35]/30 hover:shadow-[#FF6B35]/10 flex flex-col min-h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/5 via-transparent to-[#1d4ed8]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="rounded-xl border border-[#10b981]/30 bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5 p-5 backdrop-blur">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#10b981]/20">
                        <svg className="h-4 w-4 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#10b981] mb-3">Selfie Requirements</p>
                        <ul className="text-xs text-slate-300 leading-relaxed space-y-2">
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
              </div>

              {/* Right Side - Camera View */}
              <div className="group relative rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#FF6B35]/30 hover:shadow-[#FF6B35]/10 overflow-hidden flex flex-col min-h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/5 via-transparent to-[#1d4ed8]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10 flex flex-col flex-1 min-h-0">
                  {/* Camera View / Preview */}
                  <div className="relative rounded-xl border-2 border-[--color-border] bg-[--color-surface] overflow-hidden flex items-center justify-center flex-1 min-h-[300px] w-full">
                  {isLoading && !capturedPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[--color-surface]">
                      <div className="text-center">
                        <svg className="h-12 w-12 mx-auto mb-3 text-[#FF6B35] animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-sm text-slate-400">Accessing camera...</p>
                      </div>
                    </div>
                  )}

                  {error && !capturedPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[--color-surface] p-6">
                      <div className="text-center">
                        <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-xl bg-red-500/20">
                          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-red-400 mb-4">{error}</p>
                        {cameraPermission === "denied" && (
                          <button
                            onClick={startCamera}
                            className="rounded-lg bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105"
                          >
                            Try Again
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {!capturedPhoto && !isLoading && !error && (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* Camera overlay guide */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-white/50 rounded-lg" />
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
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center flex-shrink-0">
                  {!capturedPhoto ? (
                    <button
                      onClick={handleCapture}
                      disabled={isLoading || !!error || !cameraPermission}
                      className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#FF6B35]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#FF6B35]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        className="rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-[#FF6B35]/50 hover:bg-[--color-surface-alt]"
                      >
                        Retake
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#FF6B35]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#FF6B35]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isLoading ? (
                            <>
                              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Verifying...
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
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      </button>
                    </>
                  )}
                </div>

                {/* Error Message */}
                {error && capturedPhoto && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-500/5 px-4 py-3 backdrop-blur flex-shrink-0">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/20">
                      <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-red-400">{error}</p>
                  </div>
                )}

                <p className="mt-4 text-center text-xs text-slate-400 flex-shrink-0">
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

