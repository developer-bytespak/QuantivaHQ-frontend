"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface LogoProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Logo({ collapsed = false, onToggle }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (onToggle) {
      e.preventDefault();
      onToggle();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group flex items-center gap-3 text-lg font-semibold tracking-tight text-slate-100 transition-opacity hover:opacity-80 cursor-pointer"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <div className="relative flex h-14 w-14 items-center justify-center transition-transform duration-300 group-hover:scale-105">
        {imageError ? (
          <span className="text-2xl font-bold text-white">Q</span>
        ) : (
          <Image
            src="/logo_quantiva.svg"
            alt="QuantivaHQ Logo"
            width={56}
            height={56}
            className="object-contain"
            priority
            unoptimized
            onError={() => setImageError(true)}
          />
        )}
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold uppercase tracking-[0.15em] text-white">
            QuantivaHQ
          </span>
          <span className="text-[10px] text-slate-400 group-hover:text-slate-300">
            Trade with Intelligence
          </span>
        </div>
      )}
    </button>
  );
}
