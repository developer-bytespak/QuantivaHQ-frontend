type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestParams<T> = {
  path: string;
  method?: HttpMethod;
  body?: T;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.quantivahq.dev";

export async function apiRequest<TRequest, TResponse = unknown>({
  path,
  method = "GET",
  body,
}: RequestParams<TRequest>): Promise<TResponse> {
  // Placeholder network layer; swap with real implementation later.
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (process.env.NODE_ENV === "development") {
    console.info(`[API] ${method} ${path}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as TResponse;
}
