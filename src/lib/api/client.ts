import axios, { AxiosInstance } from "axios";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type RequestParams<T> = {
  path: string;
  method?: HttpMethod;
  body?: T;
  credentials?: RequestCredentials;
  timeout?: number; // Timeout in milliseconds (default: 30000 for regular requests, 180000 for ML operations)
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

// Create axios instance with defaults
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies (refresh token)
  timeout: 30000,
  headers: {
    // Note: Browsers automatically handle Accept-Encoding for compression
    // Manual setting causes "unsafe header" warnings in console
  },
});

// Main API request function
export async function apiRequest<TRequest, TResponse = unknown>({
  path,
  method = "GET",
  body,
  timeout,
}: RequestParams<TRequest>): Promise<TResponse> {
  if (process.env.NODE_ENV === "development") {
    console.info(`[API] ${method} ${path}`);
  }

  try {
    const response = await axiosInstance({
      url: path,
      method: method.toLowerCase() as any,
      data: body,
      timeout: timeout || 30000,
      // Phase 4: Let browser cache handle Cache-Control headers from backend
      // Axios adapter uses browser's native fetch cache by default for GET
    });

    return response.data as TResponse;
  } catch (error: any) {
    let errorMessage = "API request failed";

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message?.includes("timeout")) {
      errorMessage = "Request timeout. Please try again.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw error;
  }
}

type UploadParams = {
  path: string;
  file: File;
  additionalData?: Record<string, string>;
  timeout?: number; // Timeout in milliseconds (default: 60000, use 180000+ for KYC operations with ML processing)
};

/**
 * Upload a file with multipart/form-data
 * Supports additional form fields and includes authentication cookies
 */
export async function uploadFile<TResponse = unknown>({
  path,
  file,
  additionalData,
  timeout,
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

  // Add Authorization header from stored client JWT if available
  if (typeof window !== "undefined") {
    const accessToken = localStorage.getItem("quantivahq_access_token");
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
  }

  // Add device ID header for 2FA verification
  if (typeof window !== "undefined") {
    headers["x-device-id"] = getDeviceId();
  }

  // Don't set Content-Type header - browser will set it with boundary for multipart/form-data

  // Determine timeout: use provided timeout, or detect KYC operations (longer due to ML processing), or default
  let requestTimeout = timeout;
  if (!requestTimeout) {
    // KYC selfie verification involves ML processing (liveness detection + face matching)
    if (path.includes('/kyc/selfie')) {
      requestTimeout = 180000; // 3 minutes for selfie verification with ML
    } else if (path.includes('/kyc/')) {
      requestTimeout = 120000; // 2 minutes for other KYC operations
    } else {
      requestTimeout = 60000; // 60 seconds for regular file uploads
    }
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include", // Include cookies (access_token, refresh_token)
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
      
      const uploadError = new Error(errorMessage) as any;
      uploadError.status = response.status;
      uploadError.statusCode = response.status;
      throw uploadError;
    }

    return (await response.json()) as TResponse;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Handle timeout/abort errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      const timeoutSeconds = Math.round(requestTimeout / 1000);
      const isKycOperation = path.includes('/kyc/');
      let errorMessage = `Request timeout after ${timeoutSeconds} seconds. `;
      
      if (isKycOperation) {
        errorMessage += 'KYC verification involves AI-powered face matching which may take longer. Please ensure your selfie is clear, well-lit, and try again. If the issue persists, the verification service may be temporarily busy.';
      } else {
        errorMessage += 'The operation is taking longer than expected. Please try again or ensure your images are clear and contain visible faces.';
      }
      
      throw new Error(errorMessage);
    }
    
    // Re-throw other errors (preserve status if it exists)
    if (error.status || error.statusCode) {
      const preservedError = new Error(error.message || 'Upload failed') as any;
      preservedError.status = error.status || error.statusCode;
      preservedError.statusCode = error.status || error.statusCode;
      throw preservedError;
    }
    
    throw error;
  }
}
