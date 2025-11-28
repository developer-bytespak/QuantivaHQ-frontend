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

