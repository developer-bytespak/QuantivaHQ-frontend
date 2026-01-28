"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { apiRequest } from "@/lib/api/client";

interface GooglePendingRegistration {
  email: string;
  name: string;
  google_id: string;
  picture?: string;
}

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleData, setGoogleData] = useState<GooglePendingRegistration | null>(
    null
  );

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Check if we have pending Google registration data
    const pendingData = localStorage.getItem(
      "quantivahq_google_pending_registration"
    );

    if (!pendingData) {
      // No pending registration, redirect to signup
      router.push("/onboarding/sign-up?tab=signup");
      return;
    }

    try {
      const parsed: GooglePendingRegistration = JSON.parse(pendingData);
      setGoogleData(parsed);
      setFormData((prev) => ({
        ...prev,
        email: parsed.email || "",
        // Generate a default username from email
        username:
          parsed.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") ||
          "",
      }));
    } catch {
      router.push("/onboarding/sign-up?tab=signup");
    }
  }, [router]);

  const validateForm = () => {
    if (!formData.username) {
      setError("Username is required");
      return false;
    }
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumbers = /\d/.test(formData.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setError(
        "Password must contain uppercase, lowercase, number, and special character"
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm() || !googleData) return;

    try {
      setIsLoading(true);

      // Register the user with email, username, password
      await apiRequest<any, any>({
        path: "/auth/register",
        method: "POST",
        body: {
          email: formData.email,
          username: formData.username,
          password: formData.password,
        },
      });

      // Clear pending registration data
      localStorage.removeItem("quantivahq_google_pending_registration");

      // Store user info
      localStorage.setItem("quantivahq_user_email", formData.email);
      localStorage.setItem("quantivahq_username", formData.username);
      if (googleData.name) {
        localStorage.setItem("quantivahq_user_name", googleData.name);
      }
      localStorage.setItem("quantivahq_is_new_signup", "true");
      localStorage.setItem("quantivahq_auth_method", "google");

      // Auto-login after registration
      try {
        const loginResponse = await apiRequest<any, any>({
          path: "/auth/login",
          method: "POST",
          body: {
            email: formData.email,
            password: formData.password,
          },
          credentials: "include",
        });

        if (loginResponse.requires_2fa) {
          localStorage.setItem("quantivahq_pending_2fa_email", formData.email);
          localStorage.setItem(
            "quantivahq_pending_2fa_password",
            formData.password
          );
          router.push("/onboarding/verify-2fa");
          return;
        }

        // Store tokens
        if (loginResponse.accessToken) {
          localStorage.setItem("quantivahq_access_token", loginResponse.accessToken);
        }
        if (loginResponse.refreshToken) {
          localStorage.setItem("quantivahq_refresh_token", loginResponse.refreshToken);
        }
        if (loginResponse.sessionId) {
          localStorage.setItem("quantivahq_session_id", loginResponse.sessionId);
        }
        if (loginResponse.user) {
          const userId = loginResponse.user.user_id || loginResponse.user.id;
          if (userId) {
            localStorage.setItem("quantivahq_user_id", userId);
          }
        }
        localStorage.setItem("quantivahq_is_authenticated", "true");
      } catch (loginError) {
        // Login failed but registration succeeded
        console.error("Auto-login failed:", loginError);
        // Redirect to login page
        router.push("/onboarding/sign-up?tab=login");
        return;
      }

      // Navigate to personal info
      const { navigateToNextRoute } = await import(
        "@/lib/auth/flow-router.service"
      );
      await navigateToNextRoute(router);
    } catch (err: any) {
      const errorMessage = err?.message || "Registration failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!googleData) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-[#fc4f02]/5 blur-3xl" />
        <div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-[#fc4f02]/5 blur-3xl"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-auto px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <QuantivaLogo className="h-12 w-12" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">
              Complete Your Registration
            </h1>
            <p className="text-sm text-slate-400">
              Create a username and password to secure your account
            </p>
          </div>

          {/* Google Account Info */}
          <div className="mb-6 rounded-xl border border-[--color-border] bg-[--color-surface-alt]/50 p-4">
            <div className="flex items-center gap-3">
              {googleData.picture ? (
                <img
                  src={googleData.picture}
                  alt="Profile"
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#fc4f02] to-[#fda300]">
                  <svg
                    className="h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{googleData.name}</p>
                <p className="text-xs text-slate-400">{googleData.email}</p>
              </div>
              <div>
                <svg
                  className="h-5 w-5 text-green-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email - Pre-filled & Read-only */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border-2 border-[--color-border] bg-[--color-surface]/50 px-4 py-3 text-slate-400"
              />
              <p className="mt-1 text-xs text-slate-500">
                Email from your Google account
              </p>
            </div>

            {/* Username */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-4 py-3 text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none"
                placeholder="Choose a username"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Letters, numbers, and underscores only
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-4 py-3 pr-12 text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Min 8 characters with uppercase, lowercase, number & special
                character
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-4 py-3 pr-12 text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#fc4f02]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <svg
                      className="h-5 w-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
          </form>

          {/* Back to Sign Up */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                localStorage.removeItem("quantivahq_google_pending_registration");
                router.push("/onboarding/sign-up?tab=signup");
              }}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              ← Back to Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
