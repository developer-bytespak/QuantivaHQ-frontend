"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { adminLogin } from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notification, showNotification, hideNotification } = useNotification();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const returnTo = searchParams.get("returnTo") ?? "/admin/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showNotification("Please enter email and password", "error");
      return;
    }
    setLoading(true);
    try {
      await adminLogin({ email: email.trim(), password });
      showNotification("Login successful", "success");
      router.replace(returnTo.startsWith("/admin") ? returnTo : "/admin/dashboard");
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Login failed";
      showNotification(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[--color-background] px-4 py-8">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      {/* Centered card - orange gradient like Profile/Settings reference */}
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-b from-[#fc4f02]/90 via-[#fc4f02]/70 to-[#fda300]/50 p-8 shadow-xl border border-[#fc4f02]/30">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
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
        <h1 className="mb-1 text-center text-2xl font-bold text-white">VC Pool Admin</h1>
        <p className="mb-8 text-center text-sm text-white/80">Sign in to manage pools and settings</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-white/90">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@quantiva.io"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-white/90">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-12 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878a4.5 4.5 0 106.262 6.262M4.031 11.117A9.953 9.953 0 003 12c0 4.478 2.943 8.268 7 9.543 2.244-1.22 4.235-2.743 5.858-4.243m-1.757-1.757L4.031 11.117" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-[#fc4f02] shadow-lg hover:bg-white/95 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>

      <p className="mt-8 text-center">
        <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Back to app
        </Link>
      </p>
    </div>
  );
}
