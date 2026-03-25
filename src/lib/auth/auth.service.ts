import { apiRequest } from "../api/client";
import { logger } from "../utils/logger";

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  emailOrUsername: string;
  password: string;
}

export interface Verify2FAData {
  emailOrUsername: string;
  code: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
  twoFactorCode: string;
}

export interface User {
  user_id: string;
  email: string;
  username: string;
  email_verified: boolean;
  kyc_status: string;
  created_at?: string;
}

export const authService = {
  async register(data: RegisterData) {
    return apiRequest<RegisterData, { user: User; message: string }>({
      path: "/auth/register",
      method: "POST",
      body: data,
    });
  },

  async login(data: LoginData) {
    const response = await apiRequest<LoginData, { requires2FA: boolean; message: string }>({
      path: "/auth/login",
      method: "POST",
      body: data,
    });
    logger.info("[Login] Response:", response);
    return response;
  },

  async verify2FA(data: Verify2FAData, deviceId?: string) {
    return apiRequest<Verify2FAData, { user: User; message: string }>({
      path: "/auth/verify-2fa",
      method: "POST",
      body: data,
      credentials: "include",
    });
  },

  async refresh() {
    // Send refresh token in body so refresh works when cookies aren't sent (e.g. cross-origin).
    // Backend accepts either cookie (refresh_token) or body (refreshToken).
    const refreshToken =
      typeof window !== "undefined" ? localStorage.getItem("quantivahq_refresh_token") : null;
    const result = await apiRequest<
      { refreshToken?: string | null },
      { message: string; accessToken?: string; refreshToken?: string }
    >({
      path: "/auth/refresh",
      method: "POST",
      body: refreshToken ? { refreshToken } : {},
      credentials: "include",
    });
    // Store new tokens so subsequent requests use the new access token.
    if (typeof window !== "undefined" && result?.accessToken) {
      localStorage.setItem("quantivahq_access_token", result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem("quantivahq_refresh_token", result.refreshToken);
      }
    }
    return result;
  },

  async getCurrentUser() {
    return apiRequest<never, User>({
      path: "/auth/me",
      method: "GET",
      credentials: "include",
    });
  },

  async logout() {
    // Call backend logout API FIRST (with access token still in localStorage)
    // This allows the server to clean up sessions using the session_id from the access token
    if (typeof window !== "undefined") {
      try {
        const accessToken = localStorage.getItem("quantivahq_access_token");
        await apiRequest<never, { message: string }>({
          path: "/auth/logout",
          method: "POST",
          credentials: "include",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
      } catch (err) {
        // Logout API errors are OK, we'll still clear client state
        console.warn("authService.logout: server logout failed (ok, clearing client)", err);
      }
    }

    // Client-side cleanup AFTER: clear tokens from localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("quantivahq_access_token");
        localStorage.removeItem("quantivahq_refresh_token");
        localStorage.removeItem("quantivahq_user_email");
        localStorage.removeItem("quantivahq_user_name");
        localStorage.removeItem("quantivahq_user_id");
        localStorage.removeItem("quantivahq_auth_method");
        localStorage.removeItem("quantivahq_is_authenticated");
        localStorage.removeItem("quantivahq_selected_exchange");
        localStorage.removeItem("quantivahq_personal_info");
        localStorage.removeItem("quantivahq_profile_image");
        localStorage.removeItem("quantivahq_pending_email");
        localStorage.removeItem("quantivahq_pending_password");
        localStorage.removeItem("quantivahq_device_id");
        sessionStorage.clear();
      } catch (cleanupErr) {
        console.warn("authService.logout: client cleanup failed", cleanupErr);
      }
    }

    // Force a full page navigation to the sign-up/login page to reset state and ensure cookies are re-evaluated by the server
    if (typeof window !== "undefined") {
      window.location.href = "/onboarding/sign-up?tab=login";
    }

    return { message: "Logged out" } as { message: string };
  },

  async requestPasswordChangeCode() {
    return apiRequest<never, { message: string }>({
      path: "/auth/request-password-change-code",
      method: "POST",
      credentials: "include",
    });
  },

  async changePassword(data: ChangePasswordData) {
    return apiRequest<ChangePasswordData, { message: string }>({
      path: "/auth/change-password",
      method: "POST",
      body: data,
      credentials: "include",
    });
  },
};

