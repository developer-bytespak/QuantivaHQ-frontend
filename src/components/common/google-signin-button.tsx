"use client";

import React from "react";
import { apiRequest } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useNotification, Notification } from "./notification";
import { getCurrentUser } from "@/lib/api/user";

type Props = { onSuccess?: (data: any) => void };

export default function GoogleSignInButton({ onSuccess }: Props) {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  const isProcessingRef = React.useRef(false);

  // Initialize GSI button on mount and whenever this component re-mounts
  React.useEffect(() => {
    const initializeGSI = () => {
      const container = document.getElementById("g_id_signin");
      if (!container) {
        console.warn("GoogleSignInButton: container #g_id_signin not found");
        return;
      }

      // @ts-ignore
      if (!window.google?.accounts?.id) {
        console.warn("GoogleSignInButton: google.accounts.id not yet available, retrying...");
        setTimeout(initializeGSI, 500);
        return;
      }

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error("GoogleSignInButton: NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Please add it to your frontend .env.local and restart the dev server.");
        container.innerHTML = '<button class="rounded-lg px-4 py-2 text-sm font-medium">Google sign-in unavailable</button>';
        return;
      }

      // Initialize and render the button every time (safe to call multiple times)
      try {
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        // Clear container before rendering to avoid duplicate buttons
        container.innerHTML = "";

        // @ts-ignore
        window.google.accounts.id.renderButton(container, {
          theme: "filled_white",
          size: "large",
        });
      } catch (err) {
        console.warn("GoogleSignInButton: failed to render GSI button", err);
      }
    };

    // Load GSI script if not already loaded
    const scriptId = "google-identity";
    let existingScript = document.getElementById(scriptId);

    if (existingScript) {
      // Script already loaded, try to initialize immediately
      initializeGSI();
    } else {
      // Load script for the first time
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGSI;
      document.body.appendChild(script);
    }
  }, []); // Empty dependency array - runs once on mount

  const handleCredentialResponse = async (response: any) => {
    // Prevent duplicate / concurrent processing which can cause repeated API calls
    if (isProcessingRef.current) {
      console.debug(
        "GoogleSignInButton: already processing a credential response, ignoring duplicate callback"
      );
      return;
    }
    isProcessingRef.current = true;

    if (!response?.credential) {
      isProcessingRef.current = false;
      return;
    }
    try {
      // Post idToken to backend
      const data = await apiRequest<{ idToken: string }, any>({
        path: "/auth/google",
        method: "POST",
        body: { idToken: response.credential },
        credentials: "include",
      });

      // DEBUG: Log backend response to see what we're getting
      console.log("Google Auth Response from backend:", JSON.stringify(data, null, 2));

      // Check if this is a new user who needs to complete registration
      // Handle both direct response and nested data response
      const responseData = data?.data || data;
      const isNewUser = responseData?.is_new_user === true;
      const googleUser = responseData?.google_user;

      console.log("Parsed - isNewUser:", isNewUser, "googleUser:", googleUser);

      if (isNewUser && googleUser) {
        // Store Google user info for the complete-registration page
        localStorage.setItem(
          "quantivahq_google_pending_registration",
          JSON.stringify({
            email: googleUser.email,
            name: googleUser.name,
            google_id: googleUser.google_id,
            picture: googleUser.picture,
          })
        );
        
        isProcessingRef.current = false;
        // Route to complete registration page
        router.push("/onboarding/complete-registration");
        return;
      }

      // Existing user - proceed with login
      // store auth method and email
      try {
        if (data?.user?.email) {
          localStorage.setItem("quantivahq_user_email", data.user.email);
          localStorage.setItem(
            "quantivahq_user_name",
            data.user.username || data.user.email.split("@")[0]
          );
        }
        localStorage.setItem("quantivahq_auth_method", "google");
        // Store tokens (client-JWT flow)
        if (data?.accessToken)
          localStorage.setItem("quantivahq_access_token", data.accessToken);
        if (data?.refreshToken)
          localStorage.setItem("quantivahq_refresh_token", data.refreshToken);
        localStorage.setItem(
          "quantivahq_is_authenticated",
          data?.accessToken ? "true" : "false"
        );
        // Set new signup flag if this is a new user (legacy check)
        if (data?.isNewUser) {
          localStorage.setItem("quantivahq_is_new_signup", "true");
        }
      } catch {}

      onSuccess?.(data);

      // Use flow router to determine next step in onboarding
      const { navigateToNextRoute } = await import("@/lib/auth/flow-router.service");
      try {
        await navigateToNextRoute(router);
      } catch (verifyErr: any) {
        const msg = verifyErr?.message || "Failed to verify session after sign-in.";
        console.warn("Verification after Google sign-in failed:", verifyErr);
        showNotification(msg, "error");
        isProcessingRef.current = false;
      }
    } catch (err: any) {
      console.error("Google sign-in failed", err);
      const message = err?.message || "Google sign-in failed. Please try again.";
      // show notification with backend reason
      showNotification(message, "error");
      // also return error to caller
      onSuccess?.({ error: message });
      isProcessingRef.current = false;
    }
  };

  return (
    <>
      <div id="g_id_signin" />
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
