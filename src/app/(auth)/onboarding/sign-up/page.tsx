"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { useState, useEffect } from "react";
import GoogleSignInButton from "@/components/common/google-signin-button";
import { apiRequest } from "@/lib/api/client";
import { navigateToNextRoute } from "@/lib/auth/flow-router.service";
import { getCurrentUser } from "@/lib/api/user";

type AuthTab = "signup" | "login";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AuthTab>("signup");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Check if user is already authenticated and redirect if so
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        // Try to get current user - if successful, user is authenticated (validates session via cookies)
        await getCurrentUser();
        
        // User is authenticated, redirect immediately - don't show sign-up/login page
        if (isMounted) {
          await navigateToNextRoute(router);
          // Keep loading state to prevent showing page content
          return;
        }
      } catch (error: any) {
        // User is not authenticated or session is invalid
        // Check if it's a 401/unauthorized error (expected for unauthenticated users)
        if (error?.status === 401 || error?.statusCode === 401 || 
            error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
          // User is not authenticated, allow access to sign-up/login page
          if (isMounted) {
            setIsCheckingAuth(false);
          }
        } else {
          // Other error - still allow access but log it
          console.error("Error checking authentication:", error);
          if (isMounted) {
            setIsCheckingAuth(false);
          }
        }
      }
    };
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setIsCheckingAuth(false);
      }
    }, 5000); // 5 second timeout
    
    checkAuth();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [router]);
  
  // Read tab query parameter and set active tab
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "login" || tab === "signup") {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

      setIsLoading(true);

      try {
        // Call register API
        const response = await apiRequest<{
          email: string;
          username: string;
          password: string;
        }>({
          path: "/auth/register",
          method: "POST",
          body: {
            email,
            username: fullName.split(" ")[0] || email.split("@")[0],
            password,
          },
          credentials: "include",
        });

        // Store user info
        localStorage.setItem("quantivahq_user_email", email);
        localStorage.setItem("quantivahq_user_name", fullName || email.split("@")[0]);
        localStorage.setItem("quantivahq_auth_method", "email");
        localStorage.setItem("quantivahq_is_authenticated", "true");
        localStorage.setItem("quantivahq_is_new_signup", "true"); // Flag for new signup

        // Automatically log in after successful registration
        try {
          // Call login API (triggers 2FA code)
          const loginResponse = await apiRequest<
            {
              emailOrUsername: string;
              password: string;
            },
            {
              user?: any;
              accessToken?: string;
              refreshToken?: string;
              sessionId?: string;
              requires2FA?: boolean;
              message: string;
            }
          >({
            path: "/auth/login",
            method: "POST",
            body: {
              emailOrUsername: email,
              password,
            },
            credentials: "include",
          });

          // Debug: Log cookies and response
          console.log("[Signup] Cookies after auto-login:", document.cookie);
          console.log("[Signup] Login response:", loginResponse);

          // Check if 2FA is required
          if (loginResponse.requires2FA) {
            // Store pending email and password for 2FA verification
            localStorage.setItem("quantivahq_pending_email", email);
            localStorage.setItem("quantivahq_pending_password", password);
            
            // Navigate to 2FA verification page
            router.push("/onboarding/verify-2fa");
          } else if (loginResponse.accessToken) {
            // 2FA is disabled - store tokens from response as fallback
            console.log("[Signup] Storing tokens from response body as fallback");
            localStorage.setItem("quantivahq_access_token", loginResponse.accessToken);
            if (loginResponse.refreshToken) {
              localStorage.setItem("quantivahq_refresh_token", loginResponse.refreshToken);
            }
            if (loginResponse.sessionId) {
              localStorage.setItem("quantivahq_session_id", loginResponse.sessionId);
            }

            // Small delay to ensure cookies are set in browser
            await new Promise(resolve => setTimeout(resolve, 100));

            // Navigate to next step in onboarding flow
            try {
              await navigateToNextRoute(router);
            } catch (navError: any) {
              console.error("[Signup] Navigation error:", navError);
              // If navigation fails, default to proof upload
              router.push("/onboarding/proof-upload");
            }
          }
        } catch (loginError: any) {
          console.error("[Signup] Auto-login error:", loginError);
          // If auto-login fails, show error but don't switch tabs
          setError(loginError.message || "Registration successful, but automatic login failed. Please log in manually.");
          setIsLoading(false);
        }
      } catch (error: any) {
        setError(error.message || "Registration failed. Please try again.");
        setIsLoading(false);
      }
    } else {
      // Login flow
      if (!email || !password) {
        setError("Please fill in all fields");
        return;
      }

      setIsLoading(true);

      try {
        // Login (triggers 2FA code)
        const response = await apiRequest<
          {
            emailOrUsername: string;
            password: string;
          },
          {
            user?: any;
            accessToken?: string;
            refreshToken?: string;
            sessionId?: string;
            requires2FA?: boolean;
            message: string;
          }
        >({
          path: "/auth/login",
          method: "POST",
          body: {
            emailOrUsername: email,
            password,
          },
          credentials: "include",
        });

        // Debug: Log cookies and response
        console.log("[Login] Cookies after login:", document.cookie);
        console.log("[Login] Login response:", response);

        // Check if 2FA is required
        if (response.requires2FA) {
          // Store pending email and password for 2FA verification
          localStorage.setItem("quantivahq_pending_email", email);
          localStorage.setItem("quantivahq_pending_password", password);
          localStorage.setItem("quantivahq_user_email", email);
          localStorage.setItem("quantivahq_auth_method", "email");
          
          // Stop loading and navigate to 2FA verification page
          setIsLoading(false);
          router.push("/onboarding/verify-2fa");
        } else if (response.accessToken) {
          // 2FA is disabled - tokens returned directly
          localStorage.setItem("quantivahq_user_email", email);
          localStorage.setItem("quantivahq_auth_method", "email");
          localStorage.setItem("quantivahq_is_authenticated", "true");
          
          // Store tokens from response as fallback
          console.log("[Login] Storing tokens from response body as fallback");
          localStorage.setItem("quantivahq_access_token", response.accessToken);
          if (response.refreshToken) {
            localStorage.setItem("quantivahq_refresh_token", response.refreshToken);
          }
          if (response.sessionId) {
            localStorage.setItem("quantivahq_session_id", response.sessionId);
          }

          // Small delay to ensure cookies are set in browser
          await new Promise(resolve => setTimeout(resolve, 100));

          // Navigate to next step in onboarding flow
          try {
            await navigateToNextRoute(router);
          } catch (navError: any) {
            console.error("[Login] Navigation error:", navError);
            console.error("[Login] Error details:", {
              status: navError.status,
              statusCode: navError.statusCode,
              message: navError.message,
            });
            // If authentication failed (401), show error to user
            if (navError.status === 401 || navError.statusCode === 401) {
              setError("Login succeeded but session couldn't be established. This may be a cookie/CORS issue. Please try again or contact support.");
              setIsLoading(false);
            } else {
              // For other errors, default to proof upload
              router.push("/onboarding/proof-upload");
            }
          }
        }
      } catch (error: any) {
        console.error("[Login] Login error:", error);
        setError(error.message || "Login failed. Please check your credentials.");
        setIsLoading(false);
      }
    }
  };

  const handleOAuth = async (provider: "google") => {
    // Store OAuth method
    localStorage.setItem("quantivahq_auth_method", provider);
    
    // In a real app, this would trigger OAuth flow
    // For now, simulate success and check user status
    try {
      localStorage.setItem("quantivahq_is_authenticated", "true");
      
      // Use flow router to determine next step
      await navigateToNextRoute(router);
    } catch (error) {
      // If checks fail, go to proof-upload (KYC start)
      console.log("Error checking user status:", error);
      router.push("/onboarding/proof-upload");
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="relative flex h-full w-full overflow-hidden">
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="text-center">
            <QuantivaLogo className="h-12 w-12 md:h-14 md:w-14 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-400 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Background matching Figma design */}
      <div className="absolute inset-0 bg-black">
        {/* Subtle gradient orbs for depth */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-start overflow-hidden px-4 pt-6 pb-6 sm:px-6 sm:pt-8 sm:pb-8 lg:px-8">
        {/* Back Button */}
        <div className="w-full max-w-6xl mb-4">
          <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors duration-200"
            aria-label="Back to homepage"
          >
            <svg 
              className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Homepage</span>
          </button>
        </div>

        <div className="w-full max-w-6xl">
          {/* Header Section */}
          <div className="mb-12 text-center">
            <div className="mb-3 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-12 w-12 md:h-14 md:w-14" />
            </div>
            <h1 className="mb-2 text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl animate-text-enter" style={{ animationDelay: "0.2s" }}>
              {activeTab === "signup" ? "Create Your" : "Welcome"} <span className="text-white">Account</span>
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
              <div className="group relative w-full rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/30 hover:shadow-[#fc4f02]/10">
                <div className="absolute inset-0 bg-gradient-to-br from-[#fc4f02]/5 via-transparent to-[#fda300]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10">
                  {/* Tabs */}
                  <div className="mb-3 flex gap-2 rounded-xl bg-[--color-surface]/60 p-1">
                    <button
                      onClick={() => {
                        setActiveTab("signup");
                        setError("");
                        setShowPassword(false);
                        setShowConfirmPassword(false);
                      }}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        activeTab === "signup"
                          ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Sign Up
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("login");
                        setError("");
                        setShowPassword(false);
                        setShowConfirmPassword(false);
                      }}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        activeTab === "login"
                          ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Login
                    </button>
                  </div>

                      {/* OAuth Buttons */}
                      {activeTab === "login" && (
                        <div className="grid grid-cols-1 gap-2.5">
                          {/* Google Sign-In button (GSI) */}
                          <div>
                            {/* lazy-loaded Google button component */}
                            {/* eslint-disable-next-line @next/next/no-before-interactive-script-load */}
                            {/* @ts-ignore */}
                            <GoogleSignInButton />
                          </div>
                        </div>
                      )}
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
              <div className="group relative w-full rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/30 hover:shadow-[#fc4f02]/10">
                <div className="absolute inset-0 bg-gradient-to-br from-[#fc4f02]/5 via-transparent to-[#fda300]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10">
                  {/* Email Form */}
                  <form onSubmit={handleSubmit} className="space-y-2">
                  {activeTab === "signup" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="fullName" className="mb-1.5 block text-xs font-medium text-white">
                          Username
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2.5 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20"
                          placeholder="johndoe"
                          required={activeTab === "signup"}
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-white">
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2.5 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "login" && (
                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-white">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2.5 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  )}

                  {activeTab === "login" && (
                    <div>
                      <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-white">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20"
                          placeholder="••••••••"
                          required
                        />
                        {password.length > 0 && (
                          <button
                            type="button"
                            onMouseDown={() => setShowPassword(true)}
                            onMouseUp={() => setShowPassword(false)}
                            onMouseLeave={() => setShowPassword(false)}
                            onTouchStart={() => setShowPassword(true)}
                            onTouchEnd={() => setShowPassword(false)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white active:text-[#fc4f02] transition-colors cursor-pointer"
                            aria-label="Hold to show password"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                    {activeTab === "signup" && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-white">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20"
                              placeholder="••••••••"
                              required
                            />
                            {password.length > 0 && (
                              <button
                                type="button"
                                onMouseDown={() => setShowPassword(true)}
                                onMouseUp={() => setShowPassword(false)}
                                onMouseLeave={() => setShowPassword(false)}
                                onTouchStart={() => setShowPassword(true)}
                                onTouchEnd={() => setShowPassword(false)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white active:text-[#fc4f02] transition-colors cursor-pointer"
                                aria-label="Hold to show password"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium text-white">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20"
                              placeholder="••••••••"
                              required={activeTab === "signup"}
                            />
                            {confirmPassword.length > 0 && (
                              <button
                                type="button"
                                onMouseDown={() => setShowConfirmPassword(true)}
                                onMouseUp={() => setShowConfirmPassword(false)}
                                onMouseLeave={() => setShowConfirmPassword(false)}
                                onTouchStart={() => setShowConfirmPassword(true)}
                                onTouchEnd={() => setShowConfirmPassword(false)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white active:text-[#fc4f02] transition-colors cursor-pointer"
                                aria-label="Hold to show password"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "login" && (
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-slate-400">
                          <input type="checkbox" className="rounded border-[--color-border] bg-[--color-surface] text-[#fc4f02] focus:ring-[#fc4f02]" />
                          <span>Remember me</span>
                        </label>
                        <button type="button" className="text-xs text-[#fc4f02] hover:text-[#fda300] transition-colors">
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
                        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                      <a href="#" className="text-[#fc4f02] hover:text-[#fda300] transition-colors">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-[#fc4f02] hover:text-[#fda300] transition-colors">
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

