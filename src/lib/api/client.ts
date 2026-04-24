import axios, { AxiosInstance } from "axios";
import { toast } from "react-toastify";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type RequestParams<T> = {
  path: string;
  method?: HttpMethod;
  body?: T;
  credentials?: RequestCredentials;
  timeout?: number; // Timeout in milliseconds (default: 30000 for regular requests, 180000 for ML operations)
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL && typeof window !== "undefined") {
  console.warn("NEXT_PUBLIC_API_URL is not set — API calls will fail in production.");
}
const RESOLVED_API_URL = API_BASE_URL ?? "http://localhost:3000";

let refreshPromise: Promise<string> | null = null;

// Helper function to get or create device ID (crypto-secure)
function getDeviceId(): string {
  if (typeof window !== "undefined") {
    let deviceId = localStorage.getItem("quantivahq_device_id");
    if (!deviceId) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      deviceId = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem("quantivahq_device_id", deviceId);
    }
    return deviceId;
  }
  return "";
}

// Create axios instance with defaults
const axiosInstance: AxiosInstance = axios.create({
  baseURL: RESOLVED_API_URL,
  withCredentials: true, // Include cookies (refresh token)
  timeout: 30000,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    // Note: Browsers automatically handle Accept-Encoding for compression
    // Manual setting causes "unsafe header" warnings in console
  },
});

async function refreshAccessToken(): Promise<string> {
  const refreshToken =
    typeof window !== "undefined" ? localStorage.getItem("quantivahq_refresh_token") : null;

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const { data } = await axios.post(
    `${RESOLVED_API_URL}/auth/refresh`,
    { refreshToken },
    {
      withCredentials: true,
      timeout: 30000,
      headers: typeof window !== "undefined" ? { "x-device-id": getDeviceId() } : undefined,
    },
  );

  const newAccessToken: string | undefined = data?.accessToken;
  const newRefreshToken: string | undefined = data?.refreshToken;

  if (!newAccessToken) {
    throw new Error("No access token in refresh response");
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("quantivahq_access_token", newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem("quantivahq_refresh_token", newRefreshToken);
    }
  }

  return newAccessToken;
}

function getRefreshPromise(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Attach Authorization header + device ID on every request.
// Cookies may be blocked cross-origin (Chrome third-party cookie restrictions),
// so we always send the Bearer token from localStorage as a reliable fallback.
// Backend accepts both cookie and Authorization header (jwt.strategy.ts).
axiosInstance.interceptors.request.use(async (config) => {
  if (typeof window === "undefined") {
    return config;
  }

  config.headers["x-device-id"] = getDeviceId();

  const isRefreshRequest = config.url?.includes("/auth/refresh");
  const accessToken = localStorage.getItem("quantivahq_access_token");

  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
    return config;
  }

  // If access token is missing, try to recover it before sending protected requests.
  if (!isRefreshRequest) {
    try {
      const newAccessToken = await getRefreshPromise();
      config.headers["Authorization"] = `Bearer ${newAccessToken}`;
    } catch {
      // Let the request continue; response interceptor/auth flow will handle failures.
    }
  }

  return config;
});

// ─── 401 Auto-Refresh Interceptor ─────────────────────────────────────────────
// When any request gets a 401, silently refresh the access token and retry.
// Parallel 401s are queued so only ONE refresh call is made at a time.
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s; skip auth endpoints and already-retried requests
    const skipPaths = ["/auth/login", "/auth/register", "/auth/verify-2fa", "/auth/refresh", "/auth/verify-password"];
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      skipPaths.some((p: string) => originalRequest.url?.includes(p))
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in-flight, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers["Authorization"] = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newAccessToken = await getRefreshPromise();

      // Retry original + all queued requests with fresh token
      originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      processQueue(null, newAccessToken);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed → session is dead. Clear tokens and only redirect if
      // the user is on a protected route. Public pages (/, /faq, /terms, …)
      // must not force a redirect — a returning visitor with a stale
      // "quantivahq_is_authenticated" flag would otherwise be bounced to the
      // login page just for opening the homepage.
      if (typeof window !== "undefined") {
        localStorage.removeItem("quantivahq_access_token");
        localStorage.removeItem("quantivahq_refresh_token");
        localStorage.removeItem("quantivahq_is_authenticated");
        const currentPath = window.location.pathname;
        if (
          currentPath.startsWith("/dashboard") ||
          currentPath.startsWith("/strategies")
        ) {
          window.location.href = "/onboarding/sign-up?tab=login";
        }
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
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

    // console.log("[API] Error:", error.response?.data.message);
    // toast.error(error.response?.data.message);

    // So callers see backend message (e.g. "Password is incorrect") not Axios generic "Request failed with status code 401"
    error.message = error.response?.data?.message; 
    throw error;
  }
}

type UploadParams = {
  path: string;
  file: File;
  /** Form field name for the file (default "file"). Backend may expect e.g. "screenshot". */
  fieldName?: string;
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
  fieldName = "file",
  additionalData,
  timeout,
}: UploadParams): Promise<TResponse> {
  if (process.env.NODE_ENV === "development") {
    console.info(`[API] POST ${path} (file upload: ${file.name})`);
  }

  const formData = new FormData();
  formData.append(fieldName, file);

  // Add any additional form fields
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  // Determine timeout: use provided timeout, or detect KYC operations (longer due to ML processing), or default
  let requestTimeout = timeout;
  if (!requestTimeout) {
    if (path.includes('/kyc/selfie')) {
      requestTimeout = 180000; // 3 minutes for selfie verification with ML
    } else if (path.includes('/kyc/')) {
      requestTimeout = 120000; // 2 minutes for other KYC operations
    } else {
      requestTimeout = 60000; // 60 seconds for regular file uploads
    }
  }

  try {
    const response = await axiosInstance.post(path, formData, {
      timeout: requestTimeout,
      // Don't set Content-Type - axios auto-sets multipart boundary for FormData
    });

    return response.data as TResponse;
  } catch (error: any) {
    // Handle timeout/abort errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
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

    // Extract error message from response
    let errorMessage = 'Upload failed';
    if (error.response?.data) {
      const errorData = error.response.data;
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (Array.isArray(errorData.message)) {
        errorMessage = errorData.message.join(', ');
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    }

    const uploadError = new Error(errorMessage) as any;
    uploadError.status = error.response?.status;
    uploadError.statusCode = error.response?.status;
    throw uploadError;
  }
}
