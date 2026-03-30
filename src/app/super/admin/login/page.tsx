"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { adminLogin } from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";
import { getSafeRedirect } from "@/lib/utils/security";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notification, showNotification, hideNotification } = useNotification();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const returnTo = searchParams.get("returnTo");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showNotification("Please enter email and password", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await adminLogin({ email: email.trim(), password });
      if (!result.admin.is_super_admin) {
        showNotification("This account is not a super admin", "error");
        return;
      }

      showNotification("Login successful", "success");
      router.replace(getSafeRedirect(returnTo, "/super/admin/users", "/super/admin"));
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Login failed";
      showNotification(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-black via-[--color-background] to-black px-4 py-8">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      <div className="w-full max-w-md rounded-2xl border border-[--color-border] bg-[--color-surface] p-8 shadow-2xl shadow-black/60">
        <div className="mb-6 flex justify-center">
          <div className="relative h-14 w-14">
            {logoError ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold text-white">
                Q
              </div>
            ) : (
              <Image
                src="/logo_quantiva.svg"
                alt="QuantivaHQ"
                width={56}
                height={56}
                className="object-contain"
                unoptimized
                onError={() => setLogoError(true)}
              />
            )}
          </div>
        </div>
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fc4f02]/10 px-3 py-1 text-[11px] font-medium text-[#fc4f02]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#fc4f02] animate-pulse" />
            Super Admin Panel
          </span>
        </div>
        <h1 className="mb-1 text-center text-2xl font-bold text-white">Super admin sign in</h1>
        <p className="mb-6 text-center text-sm text-slate-300">
          Access users and VC pool admin controls.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white outline-none transition focus:border-[#fc4f02]"
              placeholder="admin@quantivahq.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 pr-10 text-sm text-white outline-none transition focus:border-[#fc4f02]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 px-3 text-xs text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#fc4f02] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-400">
          VC Pool admin?{" "}
          <Link href="/admin/login" className="text-[#fc4f02] hover:underline">
            Go to admin login
          </Link>
        </div>
      </div>
    </div>
  );
}
