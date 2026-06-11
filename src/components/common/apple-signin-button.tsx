"use client";

import React from "react";
import { apiRequest } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useNotification, Notification } from "./notification";

type Props = {
  onSuccess?: (data: any) => void;
  /** "login" → POST /auth/apple (existing account only). "signup" → POST /auth/signup/apple (new account only). */
  mode?: "login" | "signup";
};

/**
 * "Continue with Apple" button. Mirrors GoogleSignInButton: loads Apple's JS SDK,
 * opens the Apple sign-in popup, then posts the returned id_token to the backend
 * which verifies it and logs the user in (or creates the account).
 */
export default function AppleSignInButton({ onSuccess, mode = "login" }: Props) {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  const isProcessingRef = React.useRef(false);
  const modeRef = React.useRef(mode);
  const [ready, setReady] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState(false);
  modeRef.current = mode;

  React.useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    const redirectURI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;
    if (!clientId || !redirectURI) {
      console.error(
        "AppleSignInButton: NEXT_PUBLIC_APPLE_CLIENT_ID / NEXT_PUBLIC_APPLE_REDIRECT_URI not set. Add them to .env.local and restart the dev server."
      );
      setUnavailable(true);
      return;
    }

    const initAppleId = () => {
      // @ts-ignore
      if (!window.AppleID?.auth) {
        setTimeout(initAppleId, 500);
        return;
      }
      try {
        // @ts-ignore
        window.AppleID.auth.init({
          clientId,
          scope: "name email",
          redirectURI,
          usePopup: true,
        });
        setReady(true);
      } catch (err) {
        console.warn("AppleSignInButton: failed to init AppleID", err);
        setUnavailable(true);
      }
    };

    const scriptId = "apple-id-sdk";
    const existing = document.getElementById(scriptId);
    if (existing) {
      initAppleId();
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
      script.async = true;
      script.defer = true;
      script.onload = initAppleId;
      document.body.appendChild(script);
    }
  }, []);

  const handleClick = async () => {
    if (isProcessingRef.current || !ready) return;
    isProcessingRef.current = true;
    try {
      // @ts-ignore
      const res = await window.AppleID.auth.signIn();
      const idToken: string | undefined = res?.authorization?.id_token;
      if (!idToken) {
        isProcessingRef.current = false;
        return;
      }

      const isSignup = modeRef.current === "signup";
      const path = isSignup ? "/auth/signup/apple" : "/auth/apple";

      // Forward the affiliate ref on signup, same as the Google button.
      let referralCode: string | undefined;
      if (isSignup) {
        const { getAffiliateRef, clearAffiliateRef } = await import(
          "@/lib/utils/affiliate-ref"
        );
        referralCode = getAffiliateRef();
        if (referralCode) clearAffiliateRef();
      }

      const data = await apiRequest<
        { idToken: string; referralCode?: string },
        any
      >({
        path,
        method: "POST",
        body: {
          idToken,
          ...(referralCode ? { referralCode } : {}),
        },
        credentials: "include",
      });

      try {
        if (data?.user?.email) {
          localStorage.setItem("quantivahq_user_email", data.user.email);
          localStorage.setItem(
            "quantivahq_user_name",
            data.user.username || data.user.email.split("@")[0]
          );
        }
        localStorage.setItem("quantivahq_is_admin", String(data?.user?.isAdmin ?? false));
        localStorage.setItem(
          "quantivahq_is_super_admin",
          String(data?.user?.isSuperAdmin ?? false)
        );
        localStorage.setItem("quantivahq_auth_method", "apple");
        if (data?.accessToken)
          localStorage.setItem("quantivahq_access_token", data.accessToken);
        if (data?.refreshToken)
          localStorage.setItem("quantivahq_refresh_token", data.refreshToken);
        localStorage.setItem(
          "quantivahq_is_authenticated",
          data?.accessToken ? "true" : "false"
        );
        const isNewUser = data?.isNewUser === true || data?.user?.isNewUser === true;
        if (isNewUser) {
          window.fbq?.("track", "CompleteRegistration", {
            content_name: "Account Created",
            status: true,
          });
        }
        if (isSignup) {
          const userId = data?.user?.user_id ?? data?.user_id;
          if (userId) localStorage.setItem("quantivahq_user_id", String(userId));
        }
      } catch {}

      onSuccess?.(data);

      const { navigateToDashboard } = await import("@/lib/auth/flow-router.service");
      try {
        await navigateToDashboard(router);
      } catch (verifyErr: any) {
        const msg = verifyErr?.message || "Failed to reach the dashboard after sign-in.";
        console.warn("Navigation after Apple sign-in failed:", verifyErr);
        showNotification(msg, "error");
        isProcessingRef.current = false;
      }
    } catch (err: any) {
      // User-cancelled the Apple popup → err.error === "popup_closed_by_user". Stay silent.
      if (err?.error && err.error === "popup_closed_by_user") {
        isProcessingRef.current = false;
        return;
      }
      console.error("Apple sign-in failed", err);
      const message = err?.message || "Apple sign-in failed. Please try again.";
      showNotification(message, "error");
      onSuccess?.({ error: message });
      isProcessingRef.current = false;
    }
  };

  if (unavailable) {
    return (
      <button className="rounded-lg px-4 py-2 text-sm font-medium" disabled>
        Apple sign-in unavailable
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={!ready}
        className="mx-auto flex h-10 w-full max-w-[400px] items-center justify-center gap-2 rounded border border-black/10 bg-white px-4 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
        </svg>
        Continue with Apple
      </button>
      {notification ? (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      ) : null}
    </>
  );
}
