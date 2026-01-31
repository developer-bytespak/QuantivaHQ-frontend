"use client";

import { useState, useEffect } from "react";
import { QuantivaLogo } from "./quantiva-logo";

interface VerificationLoadingProps {
  capturedImage?: string;
  isComplete?: boolean;
  onComplete?: () => void;
}

const verificationMessages = [
  { text: "Uploading your selfie...", subtext: "Preparing secure connection" },
  { text: "Analyzing image quality...", subtext: "Checking clarity and lighting" },
  { text: "Detecting facial features...", subtext: "Using AI-powered recognition" },
  { text: "Performing liveness check...", subtext: "Verifying you're a real person" },
  { text: "Matching with your ID...", subtext: "Comparing facial features" },
  { text: "Validating identity...", subtext: "Cross-referencing documents" },
  { text: "Finalizing verification...", subtext: "Almost there!" },
  { text: "Processing complete...", subtext: "Preparing your results" },
];

export function VerificationLoading({ capturedImage, isComplete, onComplete }: VerificationLoadingProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Handle completion - jump to 100% when isComplete becomes true
  useEffect(() => {
    if (isComplete) {
      setProgress(100);
      setCurrentMessageIndex(verificationMessages.length - 1); // Show last message
    }
  }, [isComplete]);

  useEffect(() => {
    // Don't animate if already complete
    if (isComplete) return;

    // Cycle through messages every 2 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        const next = prev + 1;
        if (next >= verificationMessages.length - 1) {
          return verificationMessages.length - 2; // Stop at second-to-last message until complete
        }
        return next;
      });
    }, 2000);

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // Cap at 95% until actual completion
        return prev + Math.random() * 3 + 1;
      });
    }, 300);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [isComplete]);

  // Trigger exit animation when complete
  const handleComplete = () => {
    setProgress(100);
    setIsExiting(true);
    setTimeout(() => {
      onComplete?.();
    }, 500);
  };

  const currentMessage = verificationMessages[currentMessageIndex];

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black transition-opacity duration-500 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/10 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fda300]/10 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/8 blur-3xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
        
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(252, 79, 2, 0.3) 1px, transparent 1px), 
                              linear-gradient(90deg, rgba(252, 79, 2, 0.3) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
        {/* Logo with pulse ring */}
        <div className="relative mb-8">
          {/* Outer pulse rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full border border-[#fc4f02]/20 animate-ping" style={{ animationDuration: "2s" }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full border border-[#fc4f02]/30 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
          </div>
          
          {/* Logo container */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 backdrop-blur-sm border border-[#fc4f02]/30">
            <QuantivaLogo className="h-12 w-12 animate-pulse" />
          </div>
        </div>

        {/* Scanning animation with captured image */}
        <div className="relative w-64 h-64 mb-8">
          {/* Face outline with captured image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-44 h-56 rounded-[40%] border-2 border-[#fc4f02]/60 relative overflow-hidden shadow-lg shadow-[#fc4f02]/20">
              {/* Captured selfie image */}
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Your selfie"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              
              {/* Dark overlay for scanning effect */}
              <div className="absolute inset-0 bg-black/30" />
              
              {/* Scanning line */}
              <div
                className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#fc4f02] to-transparent animate-scan"
                style={{
                  boxShadow: "0 0 30px 8px rgba(252, 79, 2, 0.6)",
                }}
              />
              
              {/* Grid overlay for tech effect */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `linear-gradient(rgba(252, 79, 2, 0.5) 1px, transparent 1px), 
                                    linear-gradient(90deg, rgba(252, 79, 2, 0.5) 1px, transparent 1px)`,
                  backgroundSize: "20px 20px",
                }}
              />
              
              {/* Pulsing glow effect */}
              <div className="absolute inset-0 border-2 border-[#fc4f02]/40 rounded-[40%] animate-pulse" />
            </div>
          </div>
          
          {/* Corner brackets - animated */}
          <div className="absolute top-4 left-4 w-10 h-10 border-t-3 border-l-3 border-[#fc4f02] rounded-tl-lg animate-pulse" style={{ borderWidth: "3px" }} />
          <div className="absolute top-4 right-4 w-10 h-10 border-t-3 border-r-3 border-[#fc4f02] rounded-tr-lg animate-pulse" style={{ borderWidth: "3px", animationDelay: "0.2s" }} />
          <div className="absolute bottom-4 left-4 w-10 h-10 border-b-3 border-l-3 border-[#fc4f02] rounded-bl-lg animate-pulse" style={{ borderWidth: "3px", animationDelay: "0.4s" }} />
          <div className="absolute bottom-4 right-4 w-10 h-10 border-b-3 border-r-3 border-[#fc4f02] rounded-br-lg animate-pulse" style={{ borderWidth: "3px", animationDelay: "0.6s" }} />
          
          {/* Data points animation */}
          <div className="absolute top-6 left-16 flex items-center gap-1 animate-fade-in-out" style={{ animationDelay: "0.5s" }}>
            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
            <span className="text-[10px] text-[#10b981] font-mono">FACE DETECTED</span>
          </div>
          <div className="absolute bottom-6 right-12 flex items-center gap-1 animate-fade-in-out" style={{ animationDelay: "1.5s" }}>
            <div className="w-2 h-2 rounded-full bg-[#fda300] animate-ping" />
            <span className="text-[10px] text-[#fda300] font-mono">ANALYZING</span>
          </div>
          
          {/* Rotating ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-60 h-60 rounded-full border-2 border-transparent animate-spin"
              style={{
                borderTopColor: "#fc4f02",
                borderRightColor: "#fda300",
                animationDuration: "3s",
              }}
            />
          </div>
          
          {/* Second rotating ring - opposite direction */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-52 h-52 rounded-full border border-transparent animate-spin"
              style={{
                borderBottomColor: "#fc4f02",
                borderLeftColor: "rgba(252, 79, 2, 0.3)",
                animationDuration: "4s",
                animationDirection: "reverse",
              }}
            />
          </div>
        </div>

        {/* Status Messages */}
        <div className="text-center mb-8 min-h-[80px]">
          <p
            key={currentMessageIndex}
            className="text-lg sm:text-xl font-semibold text-white mb-2 animate-fade-in"
          >
            {currentMessage.text}
          </p>
          <p
            key={`sub-${currentMessageIndex}`}
            className="text-sm text-slate-400 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            {currentMessage.subtext}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">Verification Progress</span>
            <span className="text-[#fc4f02] font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#fc4f02] to-[#fda300] transition-all duration-300 ease-out shadow-lg shadow-[#fc4f02]/50 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-8 flex items-center gap-2 text-xs text-slate-500">
          <svg className="h-4 w-4 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span>Secure AI-powered verification</span>
        </div>
      </div>

      {/* Add custom animation styles */}
      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: 100%;
          }
          50.01% {
            top: 0;
          }
          100% {
            top: 100%;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-out {
          0%, 100% {
            opacity: 0;
          }
          20%, 80% {
            opacity: 1;
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .animate-fade-in-out {
          animation: fade-in-out 3s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default VerificationLoading;
