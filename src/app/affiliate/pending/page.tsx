"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { affiliateMe, affiliateLogout } from "@/lib/api/affiliate";
import type { AffiliateProfile } from "@/lib/api/affiliate";

export default function AffiliatePendingPage() {
  const router = useRouter();
  const [me, setMe] = useState<AffiliateProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    affiliateMe()
      .then((data) => {
        if (cancelled) return;
        if (data.status === "APPROVED") {
          router.replace("/affiliate/dashboard");
          return;
        }
        setMe(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await affiliateLogout();
    } catch {
      // ignore
    }
    router.replace("/affiliate/login");
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1220] p-8 text-center text-sm text-slate-400">
        Loading application status...
      </div>
    );
  }

  const isInfoRequested = me?.application?.status === "INFO_REQUESTED";
  const isRejected =
    me?.application?.status === "REJECTED" || me?.status === "REJECTED";

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-8 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Application Status</h1>
          <p className="mt-1 text-sm text-slate-400">
            Signed in as <span className="text-slate-200">{me?.email}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white"
        >
          Log out
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Stat label="Affiliate status" value={me?.status ?? "—"} />
        <Stat
          label="Application status"
          value={me?.application?.status ?? "—"}
        />
        <Stat label="Display name" value={me?.display_name ?? "—"} />
        <Stat
          label="Primary channel"
          value={me?.application?.primary_channel ?? "—"}
        />
      </div>

      {isInfoRequested && (
        <div className="mt-6 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Our team has asked for more information. Please check the email
          address you applied with.
        </div>
      )}

      {isRejected ? (
        <div className="mt-6 rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Your application was not approved.
          {me?.application?.rejection_reason && (
            <div className="mt-1 text-xs text-rose-300/80">
              Reason: {me.application.rejection_reason}
            </div>
          )}
          <div className="mt-1 text-xs text-rose-300/80">
            You may re-apply after 30 days.
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-slate-700/60 bg-slate-700/10 px-4 py-3 text-sm text-slate-200">
          Thanks for applying! A team member will review your application and
          email you when there's an update. This usually takes a few business
          days.
        </div>
      )}

      <div className="mt-6 border-t border-slate-800/80 pt-4 text-xs text-slate-500">
        Your pitch: <span className="text-slate-300">{me?.application?.pitch}</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800/80 bg-[#070d17] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
