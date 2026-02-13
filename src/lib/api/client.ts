import axios, { AxiosInstance, AxiosError } from "axios";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type RequestParams<T> = {
  path: string;
  method?: HttpMethod;
  body?: T;
  timeout?: number;
  credentials?: "include" | "omit" | "same-origin"; // Added for compatibility (handled globally by axios)
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// Mutex to prevent concurrent token refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

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

// Add request interceptor to include access token
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const accessToken = localStorage.getItem("quantivahq_access_token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
});

// Refresh token function
async function refreshAccessToken(): Promise<boolean> {
  // If already refreshing, wait for it
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await axiosInstance.post("/auth/refresh");
      
      // Save the new tokens from response to localStorage
      const newAccessToken = response.data?.accessToken || response.data?.access_token;
      const newRefreshToken = response.data?.refreshToken || response.data?.refresh_token;
      
      if (newAccessToken && typeof window !== "undefined") {
        localStorage.setItem("quantivahq_access_token", newAccessToken);
        if (process.env.NODE_ENV === "development") {
          console.info("[API] New access token stored in localStorage");
        }
      }
      
      if (newRefreshToken && typeof window !== "undefined") {
        localStorage.setItem("quantivahq_refresh_token", newRefreshToken);
        if (process.env.NODE_ENV === "development") {
          console.info("[API] New refresh token stored in localStorage");
        }
      }
      
      if (process.env.NODE_ENV === "development") {
        console.info("[API] Token refreshed successfully");
      }
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[API] Token refresh failed:", error);
      }
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Only handle 401 errors
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Don't attempt refresh on these endpoints (prevents infinite loop)
    // /auth/refresh - if refresh itself fails, don't try to refresh again
    // /auth/login, /auth/verify-2fa - these are login endpoints, no refresh needed
    const skipRefreshPaths = ["/auth/refresh", "/auth/verify-2fa", "/auth/login"];
    const shouldSkipRefresh = skipRefreshPaths.some((p) => originalRequest.url?.includes(p));

    // Don't retry if already retried once
    if (shouldSkipRefresh || originalRequest._retried) {
      return Promise.reject(error);
    }

    // Mark request as retried to prevent infinite loop
    originalRequest._retried = true;

    // Try to refresh token
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry original request with new token (interceptor will add fresh token)
      if (process.env.NODE_ENV === "development") {
        console.info("[API] Retrying request after token refresh:", originalRequest.url);
      }
      return axiosInstance(originalRequest);
    }

    // Refresh failed - just reject, let the caller (AuthGuard) handle redirect
    return Promise.reject(error);
  }
);

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

    const apiError = new Error(errorMessage) as any;
    apiError.status = error.response?.status;
    apiError.statusCode = error.response?.status;
    throw apiError;
  }
}

// File upload function
type UploadParams = {
  path: string;
  file: File;
  additionalData?: Record<string, string>;
  timeout?: number;
};

export async function uploadFile<TResponse = unknown>({
  path,
  file,
  additionalData,
  timeout,
}: UploadParams): Promise<TResponse> {
  if (process.env.NODE_ENV === "development") {
    console.info(`[API] POST ${path} (file upload: ${file.name})`);
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await axiosInstance.post(path, formData, {
      timeout: timeout || 60000,
    });

    return response.data as TResponse;
  } catch (error: any) {
    let errorMessage = "Upload failed";

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    const uploadError = new Error(errorMessage) as any;
    uploadError.status = error.response?.status;
    uploadError.statusCode = error.response?.status;
    throw uploadError;
  }
}
