import { apiRequest, uploadFile } from "./client";
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
  profile_pic_url?: string | null;
  // Optional fields that may not be returned by getUserProfile
  dob?: Date | string | null;
  nationality?: string | null;
  gender?: string | null;
  kyc_status?: "pending" | "approved" | "rejected" | "review" | null;
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
    credentials: "include",
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
        // If refresh fails, fallback to getCurrentUser
        console.warn("Token refresh failed, falling back to getCurrentUser:", refreshError);
        return getCurrentUser();
      }
    }
    
    // For other errors (500, 404, etc.), fallback to getCurrentUser instead of throwing
    console.warn("getUserProfile failed, falling back to getCurrentUser:", error);
    try {
      return await getCurrentUser();
    } catch (fallbackError) {
      // If getCurrentUser also fails, throw the original error
      throw error;
    }
  }
}

/**
 * Check if user has already filled in personal information
 * @returns true if personal info is complete, false otherwise
 */
export async function hasPersonalInfo(): Promise<boolean> {
  try {
    // Use getUserProfile which calls /users/me and returns full user data including personal info
    const user = await getUserProfile();
    // Check if required fields are filled
    return !!(user.full_name && user.dob && user.nationality);
  } catch (error) {
    console.error("Failed to check personal info:", error);
    // If getUserProfile fails, fallback to getCurrentUser
    try {
      const user = await getCurrentUser();
      return !!(user.full_name && user.dob && user.nationality);
    } catch (fallbackError) {
      console.error("Failed to check personal info (fallback):", fallbackError);
      return false;
    }
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

export interface UploadProfilePictureResponse {
  imageUrl: string;
  profile_pic_url: string;
}

/**
 * Upload profile picture
 * @param file - The image file to upload
 * @returns Upload response with image URL
 */
export async function uploadProfilePicture(
  file: File
): Promise<UploadProfilePictureResponse> {
  try {
    return await uploadFile<UploadProfilePictureResponse>({
      path: "/users/me/profile-picture",
      file,
    });
  } catch (error: any) {
    // If we get a 401, try to refresh the token and retry once
    if (error.status === 401 || error.statusCode === 401 || error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      try {
        // Try to refresh the token
        const { authService } = await import("../auth/auth.service");
        await authService.refresh();
        
        // Retry the request after refresh
        return await uploadFile<UploadProfilePictureResponse>({
          path: "/users/me/profile-picture",
          file,
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

export interface DeleteAccountRequest {
  password: string;
  twoFactorCode: string;
  reason?: string;
}

export interface DeleteAccountResponse {
  message: string;
  summary: {
    user_id: string;
    deleted_at: string;
    entities_deleted: Record<string, number>;
    cloud_storage: {
      files_deleted: number;
      files_failed: number;
      total_files: number;
    };
  };
}

export interface RequestDeleteAccountCodeResponse {
  message: string;
}

/**
 * Request a 2FA code for account deletion
 * The code will be sent to the user's email
 */
export async function requestDeleteAccountCode(): Promise<RequestDeleteAccountCodeResponse> {
  try {
    return await apiRequest<never, RequestDeleteAccountCodeResponse>({
      path: "/auth/request-delete-account-code",
      method: "POST",
      credentials: "include",
    });
  } catch (error: any) {
    // If we get a 401, try to refresh the token and retry once
    if (error.status === 401 || error.statusCode === 401 || error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      try {
        const { authService } = await import("../auth/auth.service");
        await authService.refresh();
        
        return await apiRequest<never, RequestDeleteAccountCodeResponse>({
          path: "/auth/request-delete-account-code",
          method: "POST",
          credentials: "include",
        });
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        throw new Error("Session expired. Please log in again.");
      }
    }
    throw error;
  }
}

/**
 * Delete user account with password and 2FA verification
 * @param password - User's current password
 * @param twoFactorCode - 6-digit 2FA code sent to email
 * @param reason - Optional reason for account deletion
 * @returns Delete account response with summary
 */
export async function deleteAccount(
  password: string,
  twoFactorCode: string,
  reason?: string
): Promise<DeleteAccountResponse> {
  try {
    const response = await apiRequest<DeleteAccountRequest, DeleteAccountResponse>({
      path: "/auth/delete-account",
      method: "DELETE",
      body: {
        password,
        twoFactorCode,
        reason,
      },
      credentials: "include",
    });
    console.log("[Delete Account] Response:", response);
    return response;
  } catch (error: any) {
    // If we get a 401, try to refresh the token and retry once
    if (error.status === 401 || error.statusCode === 401 || error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      try {
        // Try to refresh the token
        const { authService } = await import("../auth/auth.service");
        await authService.refresh();
        
        // Retry the request after refresh
        return await apiRequest<DeleteAccountRequest, DeleteAccountResponse>({
          path: "/auth/delete-account",
          method: "DELETE",
          body: {
            password,
            twoFactorCode,
            reason,
          },
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
