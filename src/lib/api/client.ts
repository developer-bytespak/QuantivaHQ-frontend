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

export async function apiRequest<TRequest, TResponse = unknown>({
  path,
  method = "GET",
  body,
  credentials = "include", // Include cookies in requests
  timeout, // Optional timeout override
}: RequestParams<TRequest>): Promise<TResponse> {
  if (process.env.NODE_ENV === "development") {
    console.info(`[API] ${method} ${path}`);
  }

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

  // Add device ID header for 2FA verification
  if (typeof window !== "undefined") {
    headers["x-device-id"] = getDeviceId();
  }

  // Determine timeout: use provided timeout, or detect ML operations (news/sentiment), or default to 30s
  let requestTimeout = timeout;
  if (!requestTimeout) {
    // News/sentiment now read from DB (instant), but still allow extra time for Python refresh
    if (path.includes('/news/') && path.includes('forceRefresh=true')) {
      requestTimeout = 300000; // 5 minutes only for force refresh
    } else if (path.includes('/sentiment')) {
      requestTimeout = 60000; // 1 minute for sentiment analysis
    } else {
      requestTimeout = 30000; // 30 seconds for regular API requests (including DB news reads)
    }
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials, // Include cookies (access_token, refresh_token)
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
        
        // For 401 errors, include more context
        if (response.status === 401) {
          errorMessage = `Unauthorized: ${errorMessage}. Please ensure you are logged in and your session is valid.`;
        }
      } catch {
        // If JSON parsing fails, use status text
        if (response.status === 401) {
          errorMessage = "Unauthorized: Authentication failed. Please log in again.";
        }
      }
      
      // Handle 401 errors globally - redirect to login if not already on auth pages
      if (response.status === 401 && typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes("/onboarding") || currentPath === "/";
        
        // Only redirect if not already on auth pages
        if (!isAuthPage) {
          // Clear any stored auth data
          localStorage.removeItem("quantivahq_pending_email");
          sessionStorage.clear();
          
          // Redirect to login
          window.location.href = "/onboarding/sign-up?tab=login";
          // Return early to prevent throwing error (redirect is happening)
          throw new Error("Session expired. Redirecting to login...");
        }
      }
      
      const error = new Error(errorMessage) as any;
      error.status = response.status;
      error.statusCode = response.status;
      throw error;
    }

    return (await response.json()) as TResponse;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Handle timeout/abort errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      const timeoutSeconds = Math.round(requestTimeout / 1000);
      const timeoutMinutes = Math.round(timeoutSeconds / 60);
      const isMLOperation = path.includes('/news/') || path.includes('/sentiment');
      let errorMessage = `Request timeout after ${timeoutMinutes} minute${timeoutMinutes > 1 ? 's' : ''}. `;
      
      if (isMLOperation) {
        errorMessage += 'The FinBERT ML model is still initializing. This is a one-time process that downloads ~438MB and can take 5-10 minutes depending on your internet speed. Please wait a moment and refresh the page. The model will be cached after the first download.';
      } else {
        errorMessage += 'The operation is taking longer than expected. Please try again.';
      }
      
      throw new Error(errorMessage);
    }
    
    // Re-throw other errors (preserve status if it exists)
    if (error.status || error.statusCode) {
      const preservedError = new Error(error.message || 'API request failed') as any;
      preservedError.status = error.status || error.statusCode;
      preservedError.statusCode = error.status || error.statusCode;
      throw preservedError;
    }
    
    throw error;
  }
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

  // Create AbortController for timeout (60 seconds for file uploads, especially KYC operations)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds for KYC operations

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
      throw new Error('Request timeout. The operation is taking longer than expected. Please try again or ensure your images are clear and contain visible faces.');
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
