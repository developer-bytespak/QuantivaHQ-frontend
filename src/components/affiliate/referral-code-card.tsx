"use client";

import { useState } from "react";

interface ReferralCodeCardProps {
  code: string | null;
  link: string | null;
  /**
   * Shown when the affiliate has been approved but the code hasn't been issued
   * yet, or when the application is still in review.
   */
  pendingHint?: string;
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-slate-700 bg-[#0b1220] px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-[#fc4f02]/50 hover:text-white"
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

function DownloadQrButton({ url, code }: { url: string; code: string }) {
  const [downloading, setDownloading] = useState(false);
  const onClick = async () => {
    setDownloading(true);
    try {
      // The QR is served cross-origin, so a plain `download` attribute is
      // ignored — fetch it as a blob and save from an object URL instead.
      const res = await fetch(url);
      if (!res.ok) throw new Error("QR fetch failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `referral-qr-${code}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback: let the user save it manually from a new tab.
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={downloading}
      className="rounded-md border border-slate-700 bg-[#0b1220] px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-[#fc4f02]/50 hover:text-white disabled:opacity-50"
    >
      {downloading ? "Downloading…" : "Download QR"}
    </button>
  );
}

export function ReferralCodeCard({
  code,
  link,
  pendingHint = "Your referral code will appear here once your application is approved.",
}: ReferralCodeCardProps) {
  if (!code || !link) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Referral Code
        </p>
        <p className="mt-3 text-sm text-slate-300">{pendingHint}</p>
      </div>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
  // Higher-resolution render of the same QR for the downloaded file.
  const qrDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(link)}`;

  return (
    <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-5 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Your Referral Assets
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Referral Code
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="rounded-md bg-[#0b1220] px-3 py-1.5 font-mono text-base font-semibold text-[#fc4f02]">
                {code}
              </code>
              <CopyButton label="Copy code" value={code} />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Referral Link
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-md bg-[#0b1220] px-3 py-1.5 font-mono text-sm text-slate-200">
                {link}
              </code>
              <CopyButton label="Copy link" value={link} />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="Referral QR code"
            width={120}
            height={120}
            className="rounded-md border border-slate-700 bg-white p-1"
          />
          <DownloadQrButton url={qrDownloadUrl} code={code} />
          <a
            href={qrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-white"
          >
            Open full size
          </a>
        </div>
      </div>
    </div>
  );
}
