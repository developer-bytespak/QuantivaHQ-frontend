import { apiRequest } from "./client";

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

