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
    return apiRequest<never, { message: string }>({
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
    return apiRequest<never, { message: string }>({
      path: "/auth/logout",
      method: "POST",
      credentials: "include",
    });
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

