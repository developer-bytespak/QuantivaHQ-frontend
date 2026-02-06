import axios, { AxiosInstance, AxiosError } from "axios";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type RequestParams<T> = {
  path: string;
  method?: HttpMethod;
  body?: T;
  timeout?: number;
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
    const originalRequest = error.config;

    // Only handle 401 errors
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Don't retry on auth endpoints (prevents loop)
    const skipRefreshPaths = ["/auth/me", "/auth/verify-2fa", "/auth/login"];
    const shouldSkipRefresh = skipRefreshPaths.some((p) => originalRequest.url?.includes(p));

    // Check if already on auth page
    const isAuthPage = typeof window !== "undefined" && (window.location.pathname.includes("/onboarding") || window.location.pathname === "/");

    // If skip refresh or on auth page, redirect to login
    if (shouldSkipRefresh || isAuthPage) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("quantivahq_pending_email");
        sessionStorage.clear();
        window.location.href = "/onboarding/sign-up?tab=login";
      }
      return Promise.reject(error);
    }

    // Try to refresh token
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry original request with new token
      if (process.env.NODE_ENV === "development") {
        console.info("[API] Retrying request after token refresh:", originalRequest.url);
      }
      return axiosInstance(originalRequest);
    } else {
      // Refresh failed, redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("quantivahq_pending_email");
        sessionStorage.clear();
        window.location.href = "/onboarding/sign-up?tab=login";
      }
      return Promise.reject(error);
    }
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
