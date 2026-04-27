"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api/client";

type Status = "loading" | "success" | "error" | "missing-token";

function UnsubscribeInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("missing-token");
      return;
    }

    let cancelled = false;

    apiRequest({
      path: "/onboarding/unsubscribe",
      method: "POST",
      body: { token },
    })
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch((err: { message?: string }) => {
        if (cancelled) return;
        setErrorMessage(err?.message ?? "Could not unsubscribe. The link may have expired.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="relative mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Email preferences</p>

        {status === "loading" && (
          <>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Unsubscribing…</h1>
            <p className="mt-3 text-slate-300">Hold on while we update your preferences.</p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">You're unsubscribed</h1>
            <p className="mt-3 text-slate-300">
              You won't receive any more onboarding reminders from Quantiva. Account-related emails
              (security, billing, KYC) will still come through.
            </p>
          </>
        )}

        {status === "missing-token" && (
          <>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Missing link</h1>
            <p className="mt-3 text-slate-300">
              This unsubscribe link is incomplete. Please open the link from the email directly.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Couldn't unsubscribe</h1>
            <p className="mt-3 text-slate-300">{errorMessage}</p>
            <p className="mt-3 text-slate-400 text-sm">
              If this keeps happening, reply to any reminder email and we'll handle it manually.
            </p>
          </>
        )}

        <div className="mt-8">
          <Link
            href="/"
            className="rounded-full border border-[--color-border] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-24 left-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-16 right-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>
      <Suspense fallback={null}>
        <UnsubscribeInner />
      </Suspense>
    </div>
  );
}
