type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type RequestParams<T> = {
  path: string;
  method?: HttpMethod;
  body?: T;
  credentials?: RequestCredentials;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// Helper function to get or create device ID
function getDeviceId(): string {
  if (typeof window !== "undefined") {
    let deviceId = localStorage.getItem("quantivahq_device_id");
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("quantivahq_device_id", deviceId);
    }
    return deviceId;
  }
  return "";
}

export async function apiRequest<TRequest, TResponse = unknown>({
  path,
  method = "GET",
  body,
  credentials = "include", // Include cookies in requests
}: RequestParams<TRequest>): Promise<TResponse> {
  if (process.env.NODE_ENV === "development") {
    console.info(`[API] ${method} ${path}`);
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add device ID header for 2FA verification
  if (typeof window !== "undefined") {
    headers["x-device-id"] = getDeviceId();
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials, // Include cookies (access_token, refresh_token)
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      // Handle NestJS error formats
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (Array.isArray(errorData.message)) {
        errorMessage = errorData.message.join(', ');
      } else if (errorData.message) {
        // Handle nested error objects
        if (typeof errorData.message === 'object' && errorData.message.message) {
          errorMessage = errorData.message.message;
        } else {
          errorMessage = errorData.message;
        }
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // If JSON parsing fails, use status text
    }
    
    throw new Error(errorMessage);
  }

  return (await response.json()) as TResponse;
}

type UploadParams = {
  path: string;
  file: File;
  additionalData?: Record<string, string>;
};

/**
 * Upload a file with multipart/form-data
 * Supports additional form fields and includes authentication cookies
 */
export async function uploadFile<TResponse = unknown>({
  path,
  file,
  additionalData,
}: UploadParams): Promise<TResponse> {
  if (process.env.NODE_ENV === "development") {
    console.info(`[API] POST ${path} (file upload: ${file.name})`);
  }

  const formData = new FormData();
  formData.append("file", file);

  // Add any additional form fields
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const headers: HeadersInit = {};

  // Add device ID header for 2FA verification
  if (typeof window !== "undefined") {
    headers["x-device-id"] = getDeviceId();
  }

  // Don't set Content-Type header - browser will set it with boundary for multipart/form-data

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include", // Include cookies (access_token, refresh_token)
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      // NestJS error format: { message: string } or { detail: string } or string[]
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (Array.isArray(errorData.message)) {
        // Validation errors: { message: string[] }
        errorMessage = errorData.message.join(', ');
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (parseError) {
      // If JSON parsing fails, try to get text response
      try {
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      } catch {
        // Use default error message
      }
    }
    
    throw new Error(errorMessage);
  }

  return (await response.json()) as TResponse;
}
