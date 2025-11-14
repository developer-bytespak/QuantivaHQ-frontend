"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuantivaLogo } from "./quantiva-logo";

export function SplashScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-redirect after 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        router.push("/onboarding/welcome");
      }, 300); // Wait for fade-out animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Background matching Figma design */}
      <div className="absolute inset-0 bg-black">
        {/* Subtle gradient orbs for depth */}
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
        {/* Logo with animation */}
        <div className="animate-logo-enter">
          <QuantivaLogo className="h-32 w-32 md:h-40 md:w-40" />
        </div>

        {/* Brand name */}
        <div className="animate-text-enter" style={{ animationDelay: "0.3s" }}>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            <span className="text-white">Quantiva</span>
            <span className="text-white ml-2">HQ</span>
          </h1>
        </div>

        {/* Tagline */}
        <div className="animate-text-enter" style={{ animationDelay: "0.6s" }}>
          <p className="text-lg md:text-xl text-slate-400 text-center font-light tracking-wide">
            Trade with Intelligence. Automate with Confidence.
          </p>
        </div>

        {/* Loading animation */}
        <div className="animate-text-enter mt-8" style={{ animationDelay: "0.9s" }}>
          <div className="flex space-x-2">
            <div className="h-2 w-2 rounded-full bg-[#fc4f02] animate-bounce" style={{ animationDelay: "0s" }} />
            <div className="h-2 w-2 rounded-full bg-[#fc4f02] animate-bounce" style={{ animationDelay: "0.2s" }} />
            <div className="h-2 w-2 rounded-full bg-[#fc4f02] animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

