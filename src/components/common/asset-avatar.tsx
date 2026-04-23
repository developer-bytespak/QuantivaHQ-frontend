"use client";

import { useState } from "react";

interface AssetAvatarProps {
  src?: string | null;
  symbol?: string;
  pair?: string;
  name?: string;
  className?: string;
}

function getInitials(symbol?: string, pair?: string): string {
  const raw = (symbol || pair?.split("/")[0] || "?").trim().toUpperCase();
  if (!raw || raw === "?") return "?";
  return raw.length <= 2 ? raw : raw.slice(0, 1);
}

export function AssetAvatar({
  src,
  symbol,
  pair,
  name,
  className = "h-9 w-9",
}: AssetAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;
  const initials = getInitials(symbol, pair);

  if (showImage) {
    return (
      <img
        src={src as string}
        alt={name || symbol || pair || "asset"}
        className={`${className} rounded-full bg-slate-800 object-cover ring-1 ring-white/10`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 ring-1 ring-white/10 flex items-center justify-center`}
      aria-label={name || symbol || pair || "asset"}
    >
      <span className="text-xs font-semibold text-slate-100 tracking-wide">
        {initials}
      </span>
    </div>
  );
}
