"use client";

import Image from "next/image";
import { useState } from "react";

export function QuantivaLogo({ 
  className, 
  disableFadeIn = false 
}: { 
  className?: string;
  disableFadeIn?: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  // If image fails to load, show a placeholder
  if (imageError) {
    return (
      <div className={`${className || ""} flex items-center justify-center bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 rounded-lg ${disableFadeIn ? "" : "animate-fade-in"}`}>
        <span className="text-white font-bold text-xs">Q</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className || ""}`}>
      <Image
        src="/logo_quantiva.svg"
        alt="QuantivaHQ Logo"
        fill
        className={`object-contain ${disableFadeIn ? "" : "animate-fade-in"}`}
        priority
        unoptimized
        onError={() => setImageError(true)}
      />
    </div>
  );
}

