import { apiRequest } from "./client";
import { PersonalInfoForm } from "../validation/onboarding";

export interface UpdatePersonalInfoRequest {
  fullName: string;
  dob: string;
  nationality: string;
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  phoneNumber?: string;
}

export interface UpdatePersonalInfoResponse {
  user_id: string;
  email: string;
  username: string;
  full_name: string | null;
  dob: Date | null;
  nationality: string | null;
  gender: string | null;
  phone_number: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface UserInfo {
  user_id: string;
  email: string;
  username: string;
  full_name: string | null;
  phone_number: string | null;
  // Optional fields that may not be returned by getUserProfile
  dob?: Date | string | null;
  nationality?: string | null;
  gender?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string | null;
}

/**
 * Get current authenticated user's information
 * @returns Current user information
 */
export async function getCurrentUser(): Promise<UserInfo> {
  return apiRequest<never, UserInfo>({
    path: "/auth/me",
    method: "GET",
  });
}

/**
 * Get current user's full profile including personal info
 * @returns Current user profile with personal information
 */
export async function getUserProfile(): Promise<UserInfo> {
  try {
    return await apiRequest<never, UserInfo>({
      path: "/users/me",
      method: "GET",
      credentials: "include",
    });
  } catch (error: any) {
    // If we get a 401, try to refresh the token and retry once
    if (error.status === 401 || error.statusCode === 401 || error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      try {
        // Try to refresh the token
        const { authService } = await import("../auth/auth.service");
        await authService.refresh();
        
        // Retry the request after refresh
        return await apiRequest<never, UserInfo>({
          path: "/users/me",
          method: "GET",
          credentials: "include",
        });
      } catch (refreshError) {
        // If refresh fails, throw a more helpful error
        console.error("Token refresh failed:", refreshError);
        throw new Error("Session expired. Please log in again.");
      }
    }
    throw error;
  }
}

/**
 * Check if user has already filled in personal information
 * @returns true if personal info is complete, false otherwise
 */
export async function hasPersonalInfo(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    // Check if required fields are filled
    return !!(user.full_name && user.dob && user.nationality);
  } catch (error) {
    console.error("Failed to check personal info:", error);
    return false;
  }
}

/**
 * Update user's personal information
 * @param userId - The user's ID
 * @param data - Personal information data
 * @returns Updated user information
 */
export async function updatePersonalInfo(
  userId: string,
  data: PersonalInfoForm
): Promise<UpdatePersonalInfoResponse> {
  // Transform frontend form data to backend DTO format
  const requestData: UpdatePersonalInfoRequest = {
    fullName: data.fullLegalName,
    dob: data.dateOfBirth,
    nationality: data.nationality,
    gender: data.gender,
    phoneNumber: data.phoneNumber,
  };

  return apiRequest<UpdatePersonalInfoRequest, UpdatePersonalInfoResponse>({
    path: `/users/${userId}/personal-info`,
    method: "PATCH",
    body: requestData,
  });
}

/**
 * Update current user's personal information (uses /users/me endpoint)
 * @param data - Personal information data
 * @returns Updated user information
 */
export async function updateUserProfile(
  data: UpdatePersonalInfoRequest
): Promise<UpdatePersonalInfoResponse> {
  try {
    return await apiRequest<UpdatePersonalInfoRequest, UpdatePersonalInfoResponse>({
      path: "/users/me/personal-info",
      method: "PATCH",
      body: data,
      credentials: "include",
    });
  } catch (error: any) {
    // If we get a 401, try to refresh the token and retry once
    if (error.status === 401 || error.statusCode === 401 || error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      try {
        // Try to refresh the token
        const { authService } = await import("../auth/auth.service");
        await authService.refresh();
        
        // Retry the request after refresh
        return await apiRequest<UpdatePersonalInfoRequest, UpdatePersonalInfoResponse>({
          path: "/users/me/personal-info",
          method: "PATCH",
          body: data,
          credentials: "include",
        });
      } catch (refreshError) {
        // If refresh fails, throw a more helpful error
        console.error("Token refresh failed:", refreshError);
        throw new Error("Session expired. Please log in again.");
      }
    }
    throw error;
  }
}

