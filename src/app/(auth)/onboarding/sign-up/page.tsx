"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { BackButton } from "@/components/common/back-button";
import { useState } from "react";

type AuthTab = "signup" | "login";

export default function SignUpPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (activeTab === "signup") {
      if (!fullName || !email || !password || !confirmPassword) {
        setError("Please fill in all fields");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
    } else {
      if (!email || !password) {
        setError("Please fill in all fields");
        return;
      }
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (activeTab === "signup") {
        // Store auth data in localStorage
        localStorage.setItem("quantivahq_user_email", email);
        localStorage.setItem("quantivahq_user_name", fullName || email.split("@")[0]);
        localStorage.setItem("quantivahq_auth_method", "email");
        
        setIsLoading(false);
        // Switch to login tab after account creation
        setActiveTab("login");
        setPassword("");
        setConfirmPassword("");
        setFullName("");
        setError("");
      } else {
        // Login flow
        localStorage.setItem("quantivahq_user_email", email);
        localStorage.setItem("quantivahq_auth_method", "email");
        localStorage.setItem("quantivahq_is_authenticated", "true");
        
        setIsLoading(false);
        router.push("/onboarding/personal-info");
      }
    }, 1000);
  };

  const handleOAuth = (provider: "google" | "apple") => {
    // Store OAuth method
    localStorage.setItem("quantivahq_auth_method", provider);
    
    // In a real app, this would trigger OAuth flow
    // For now, simulate success and navigate
    setTimeout(() => {
      localStorage.setItem("quantivahq_is_authenticated", "true");
      router.push("/onboarding/personal-info");
    }, 500);
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <BackButton />
      {/* Gradient background matching other onboarding pages */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b0f19] via-[#1a1f2e] to-[#0b0f19]">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#1d4ed8]/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#10b981]/10 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-start overflow-hidden px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 lg:px-8">
        <div className="w-full max-w-6xl">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <div className="mb-3 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-10 w-10 md:h-12 md:w-12" />
            </div>
            <h1 className="mb-2 text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl animate-text-enter min-h-[1.5em]" style={{ animationDelay: "0.2s" }}>
              {activeTab === "signup" ? "Create Your" : "Welcome"} <span className="text-[#FF6B35]">Account</span>
            </h1>
            <p className="mx-auto max-w-xl text-xs text-slate-400 md:text-sm animate-text-enter" style={{ animationDelay: "0.4s" }}>
              {activeTab === "signup" 
                ? "Sign up to start your AI-powered trading journey" 
                : "Sign in to continue to your trading dashboard"}
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="flex items-center gap-8 animate-text-enter" style={{ animationDelay: "0.6s" }}>
            {/* Left Side: Tabs and OAuth */}
            <div className="flex-1 flex items-center justify-center">
              <div className="group relative w-full rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#FF6B35]/30 hover:shadow-[#FF6B35]/10">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/5 via-transparent to-[#1d4ed8]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10">
                  {/* Tabs */}
                  <div className="mb-3 flex gap-2 rounded-xl bg-[--color-surface]/60 p-1">
                    <button
                      onClick={() => {
                        setActiveTab("signup");
                        setError("");
                      }}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        activeTab === "signup"
                          ? "bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-lg shadow-[#FF6B35]/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Sign Up
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("login");
                        setError("");
                      }}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        activeTab === "login"
                          ? "bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-lg shadow-[#FF6B35]/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Login
                    </button>
                  </div>

                      {/* OAuth Buttons */}
                      <div className="grid grid-cols-1 gap-2.5">
                    <button
                      onClick={() => handleOAuth("google")}
                      className="group flex items-center justify-center gap-2 rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:border-[#FF6B35]/50 hover:bg-[--color-surface-alt] hover:shadow-lg hover:shadow-[#FF6B35]/10"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Google</span>
                    </button>
                    <button
                      onClick={() => handleOAuth("apple")}
                      className="group flex items-center justify-center gap-2 rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:border-[#FF6B35]/50 hover:bg-[--color-surface-alt] hover:shadow-lg hover:shadow-[#FF6B35]/10"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      <span>Apple</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Vertical Divider */}
            <div className="relative flex items-center justify-center self-stretch">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-[--color-border]" />
              <div className="relative z-10">
                <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider whitespace-nowrap writing-vertical-rl" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                  Or Continue With Email
                </span>
              </div>
            </div>

            {/* Right Side: Email Form */}
            <div className="flex-1 flex items-center justify-center">
              <div className="group relative w-full rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#FF6B35]/30 hover:shadow-[#FF6B35]/10">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/5 via-transparent to-[#1d4ed8]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10">
                  {/* Email Form */}
                  <form onSubmit={handleSubmit} className="space-y-2">
                  {activeTab === "signup" && (
                    <div>
                        <label htmlFor="fullName" className="mb-1.5 block text-xs font-medium text-white">
                          Full Name
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2.5 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#FF6B35] focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20"
                          placeholder="John Doe"
                          required={activeTab === "signup"}
                        />
                    </div>
                  )}

                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-white">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2.5 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#FF6B35] focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20"
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-white">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2.5 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#FF6B35] focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    {activeTab === "signup" && (
                      <div>
                        <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium text-white">
                          Confirm Password
                        </label>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2.5 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#FF6B35] focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20"
                          placeholder="••••••••"
                          required={activeTab === "signup"}
                        />
                      </div>
                    )}

                    {activeTab === "login" && (
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-slate-400">
                          <input type="checkbox" className="rounded border-[--color-border] bg-[--color-surface] text-[#FF6B35] focus:ring-[#FF6B35]" />
                          <span>Remember me</span>
                        </label>
                        <button type="button" className="text-xs text-[#FF6B35] hover:text-[#FF8C5A] transition-colors">
                          Forgot password?
                        </button>
                      </div>
                    )}

                  {error && (
                    <div className="flex items-center gap-3 rounded-xl border border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-500/5 px-4 py-3 backdrop-blur">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/20">
                        <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-red-400">{error}</p>
                    </div>
                  )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#FF6B35]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#FF6B35]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {activeTab === "signup" ? "Creating Account..." : "Signing In..."}
                        </>
                      ) : (
                        <>
                          {activeTab === "signup" ? "Create Account" : "Sign In"}
                          <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </span>
                    {/* Shine effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </button>
                  </form>

                  {/* Terms and Privacy */}
                  {activeTab === "signup" && (
                    <p className="mt-4 text-center text-[10px] text-slate-400">
                      By signing up, you agree to our{" "}
                      <a href="#" className="text-[#FF6B35] hover:text-[#FF8C5A] transition-colors">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-[#FF6B35] hover:text-[#FF8C5A] transition-colors">
                        Privacy Policy
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

