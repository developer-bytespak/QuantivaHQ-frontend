import { apiRequest } from "./client";

export interface VerifyPasswordRequest {
  password: string;
}

export interface VerifyPasswordResponse {
  success: boolean;
  message: string;
}

export interface RequestPasswordChangeCodeResponse {
  message: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  twoFactorCode: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface VerifyGoogleEmailResponse {
  message: string;
  email_verified: boolean;
  google_email: boolean;
}

/**
 * Check if current user signed up with Google (no password). Used to skip password step in delete-account flow.
 */
export async function verifyGoogleEmail(): Promise<VerifyGoogleEmailResponse> {
  return apiRequest<never, VerifyGoogleEmailResponse>({
    path: "/auth/check-google-email",
    method: "POST",
    credentials: "include",
  });
}

/**
 * Request a 2FA code for password change
 * The code will be sent to the user's email
 */
export async function requestPasswordChangeCode(): Promise<RequestPasswordChangeCodeResponse> {
  return apiRequest<never, RequestPasswordChangeCodeResponse>({
    path: "/auth/request-password-change-code",
    method: "POST",
    credentials: "include",
  });
}

/**
 * Change user password
 * Requires current password, new password, and 2FA code
 */
export async function changePassword(
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  return apiRequest<ChangePasswordRequest, ChangePasswordResponse>({
    path: "/auth/change-password",
    method: "POST",
    body: data,
    credentials: "include",
  });
}

/** Forgot password: check by email if account is Google. Uses same check-google-email API with body { email }. */
export async function checkGoogleEmailByEmail(email: string): Promise<VerifyGoogleEmailResponse> {
  return apiRequest<{ email: string }, VerifyGoogleEmailResponse>({
    path: "/auth/check-google-email",
    method: "POST",
    body: { email: email.trim() },
    credentials: "include",
  });
}

/** Forgot password: send OTP to email. Call after check-email returns google_email: false. */
export async function sendForgotPasswordOtp(email: string): Promise<{ message: string }> {
  return apiRequest<{ email: string }, { message: string }>({
    path: "/auth/forgot-password/send-otp",
    method: "POST",
    body: { email: email.trim() },
    credentials: "include",
  });
}

/** Forgot password: verify OTP sent to email. Returns a resetToken for the next step. */
export async function verifyForgotPasswordOtp(email: string, otp: string): Promise<{ message: string; resetToken: string }> {
  return apiRequest<{ email: string; code: string }, { message: string; resetToken: string }>({
    path: "/auth/forgot-password/verify-otp",
    method: "POST",
    body: { email: email.trim(), code: otp.trim() },
    credentials: "include",
  });
}

/** Forgot password: set new password using the resetToken from verify-otp. */
export async function resetPasswordForgot(resetToken: string, newPassword: string): Promise<{ message: string }> {
  return apiRequest<{ resetToken: string; newPassword: string }, { message: string }>({
    path: "/auth/forgot-password/reset",
    method: "POST",
    body: { resetToken, newPassword },
    credentials: "include",
  });
}

/**
 * Verify user's current password
 * Used before sensitive operations like account deletion
 * Note: /auth/verify-password is in the interceptor's skipPaths so 401 here
 * means "Invalid password", NOT "session expired" — no auto-refresh/redirect.
 */
export async function verifyPassword(
  password: string
): Promise<VerifyPasswordResponse> {
  return apiRequest<VerifyPasswordRequest, VerifyPasswordResponse>({
    path: "/auth/verify-password",
    method: "POST",
    body: { password },
  });
}

