"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  affiliateLogin,
  setAffiliateTokens,
} from "@/lib/api/affiliate";
import { affiliateLoginSchema } from "@/lib/validation/affiliate";

export default function AffiliateLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = affiliateLoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      const res = await affiliateLogin(parsed.data);
      setAffiliateTokens(res.accessToken, res.refreshToken);
      router.replace(
        res.affiliate.status === "APPROVED"
          ? "/affiliate/dashboard"
          : "/affiliate/pending"
      );
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ?? "Login failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050a12] px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white">Affiliate Portal</h1>
          <p className="mt-1 text-sm text-slate-400">
            Log in to track your referrals and earnings.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-[#070d17] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-[#070d17] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Not an affiliate yet?{" "}
            <Link
              href="/affiliate/signup"
              className="font-semibold text-[#fc4f02] hover:underline"
            >
              Apply now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
