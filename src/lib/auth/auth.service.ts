import { apiRequest } from "../api/client";

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
    return apiRequest<LoginData, { requires2FA: boolean; message: string }>({
      path: "/auth/login",
      method: "POST",
      body: data,
    });
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
    return apiRequest<never, { message: string; accessToken?: string; refreshToken?: string }>({
      path: "/auth/refresh",
      method: "POST",
      credentials: "include",
    });
  },

  async getCurrentUser() {
    return apiRequest<never, User>({
      path: "/auth/me",
      method: "GET",
      credentials: "include",
    });
  },

  async logout() {
    // Client-side cleanup FIRST: clear tokens from localStorage so they won't be sent in the logout API request
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

    // Call backend logout API (now @Public so no JWT guard required)
    // This allows the server to clean up sessions if it can identify the user (via cookies)
    try {
      await apiRequest<never, { message: string }>({
        path: "/auth/logout",
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // Logout API errors are OK since we've already cleared client state
      console.warn("authService.logout: server logout failed (ok, client cleared)", err);
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

