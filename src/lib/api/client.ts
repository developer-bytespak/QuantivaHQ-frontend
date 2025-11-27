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
    const errorData = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as TResponse;
}
