type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestParams<T> = {
  path: string;
  method?: HttpMethod;
  body?: T;
};

type UploadParams = {
  path: string;
  file: File;
  additionalData?: Record<string, string>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Get authentication token from storage (when auth system is ready)
 * For now, returns null as auth is deferred
 */
function getAuthToken(): string | null {
  // TODO: When auth system is ready, read token from:
  // - localStorage.getItem("quantivahq_auth_token")
  // - Or from auth store/context
  return null;
}

/**
 * Make a standard API request with JSON body
 */
export async function apiRequest<TRequest, TResponse = unknown>({
  path,
  method = "GET",
  body,
}: RequestParams<TRequest>): Promise<TResponse> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add auth token when available
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (process.env.NODE_ENV === "development") {
    console.info(`[API] ${method} ${path}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  // Handle 401/403 errors gracefully (auth deferred)
  if (response.status === 401 || response.status === 403) {
    const errorMessage = "Authentication required. Please log in to continue.";
    throw new Error(errorMessage);
  }

  if (!response.ok) {
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message || errorData.detail) {
        errorMessage = errorData.message || errorData.detail;
      }
    } catch {
      // If response is not JSON, use default error message
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as TResponse;
}

/**
 * Upload a file with multipart/form-data
 * Supports additional form fields
 */
export async function uploadFile<TResponse = unknown>({
  path,
  file,
  additionalData,
}: UploadParams): Promise<TResponse> {
  const token = getAuthToken();

  const formData = new FormData();
  formData.append("file", file);

  // Add any additional form fields
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const headers: HeadersInit = {};

  // Add auth token when available
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type header - browser will set it with boundary for multipart/form-data

  if (process.env.NODE_ENV === "development") {
    console.info(`[API] POST ${path} (file upload: ${file.name})`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
    cache: "no-store",
  });

  // Handle 401/403 errors gracefully (auth deferred)
  if (response.status === 401 || response.status === 403) {
    const errorMessage = "Authentication required. Please log in to continue.";
    throw new Error(errorMessage);
  }

  if (!response.ok) {
    let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message || errorData.detail) {
        errorMessage = errorData.message || errorData.detail;
      }
    } catch {
      // If response is not JSON, use default error message
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as TResponse;
}
