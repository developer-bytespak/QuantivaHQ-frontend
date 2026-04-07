import { apiRequest } from "./client";

export interface ContactSubmissionRequest {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  message: string;
  source?: "homepage" | "help-support";
}

export interface ContactSubmissionResponse {
  message: string;
}

// Public endpoint — for homepage contact form (no auth needed)
export async function submitContactForm(
  data: ContactSubmissionRequest
): Promise<ContactSubmissionResponse> {
  return apiRequest<ContactSubmissionRequest, ContactSubmissionResponse>({
    path: "/contact",
    method: "POST",
    body: data,
  });
}

// Authenticated endpoint — for help-support page (attaches user_id)
export async function submitAuthenticatedContactForm(
  data: ContactSubmissionRequest
): Promise<ContactSubmissionResponse> {
  return apiRequest<ContactSubmissionRequest, ContactSubmissionResponse>({
    path: "/contact/authenticated",
    method: "POST",
    body: data,
  });
}
