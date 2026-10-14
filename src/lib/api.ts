/**
 * Central API client for the Varsity Hub backend.
 *
 * - Base URL comes from VITE_API_URL (falls back to the deployed Railway API).
 * - The JWT (obtained from POST /api/Auth/login) is stored in localStorage and
 *   attached as `Authorization: Bearer <token>` on every request.
 * - SSR-safe: localStorage is only touched in the browser.
 */

const REMOTE = "https://varsityhubapi-production.up.railway.app";
const ENV_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");

/**
 * Base URL resolution:
 * - If VITE_API_URL is set, always use it.
 * - In the browser during LOCAL DEV ONLY, use a RELATIVE base so requests hit
 *   `/api/*` on localhost, which the Vite dev proxy forwards to the backend
 *   (no CORS needed while developing). The dev proxy does not exist in a
 *   production build, so relative paths there would wrongly hit the frontend's
 *   own origin (e.g. Vercel) → 404.
 * - Everywhere else (production browser + all SSR) use the absolute backend URL.
 *   The backend must send CORS headers for the deployed frontend origin.
 */
const API_BASE =
  ENV_BASE ?? (typeof window !== "undefined" && import.meta.env.DEV ? "" : REMOTE);

const TOKEN_KEY = "vh_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean };

async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = opts;
  const h = new Headers(headers);
  if (body !== undefined && !(body instanceof FormData)) {
    h.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (auth && token) h.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: h,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  // Expired / invalid session — drop the token so stale creds don't linger.
  if (res.status === 401 && auth) setToken(null);

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "title" in data && (data as any).title) ||
      (data && typeof data === "object" && "message" in data && (data as any).message) ||
      res.statusText ||
      "Request failed";
    throw new ApiError(res.status, String(msg), data);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  base: API_BASE,
  get: <T>(path: string, opts?: Options) => request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: Options) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: Options) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, opts?: Options) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  del: <T>(path: string, opts?: Options) => request<T>(path, { ...opts, method: "DELETE" }),
};
