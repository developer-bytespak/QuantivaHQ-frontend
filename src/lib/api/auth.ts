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

/**
 * Verify user's current password
 * Used before sensitive operations like account deletion
 * Note: This uses a custom fetch to avoid the global 401 redirect in apiRequest,
 * since a 401 here means "Invalid password", not "session expired"
 */
export async function verifyPassword(
  password: string
): Promise<VerifyPasswordResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add Authorization header from stored client JWT if available
  if (typeof window !== "undefined") {
    const accessToken = localStorage.getItem("quantivahq_access_token");
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-password`, {
      method: "POST",
      headers,
      body: JSON.stringify({ password }),
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle invalid password (401) - don't redirect, just throw error
      if (response.status === 401) {
        throw new Error(errorData.message || "Invalid password. Please enter your correct password.");
      }
      
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json() as VerifyPasswordResponse;
  } catch (error: any) {
    // Re-throw with user-friendly message
    if (error.message?.includes("Invalid password") || error.message?.includes("correct password")) {
      throw error;
    }
    throw new Error(error.message || "Failed to verify password. Please try again.");
  }
}

