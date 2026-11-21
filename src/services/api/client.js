/**
 * API Base Client for ZapDocs CA Portal
 * Connects to CA backend endpoints with auth header handling and standard fetch lifecycle.
 */
import { storage } from "../../utils/storage.js";
import { STORAGE_KEYS } from "../../constants/storageKeys.js";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof process !== "undefined" && process.env && process.env.VITE_API_BASE_URL) ||
  "/api/v1";

export class ApiError extends Error {
  status;
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function getAuthHeaders() {
  try {
    const session = storage.get(STORAGE_KEYS.CA_SESSION);
    if (session?.token) {
      return { Authorization: `Bearer ${session.token}` };
    }
    return { Authorization: "Bearer dev_ca_local" };
  } catch {
    return { Authorization: "Bearer dev_ca_local" };
  }
}

async function request(method, path, body, params) {
  const headers = await getAuthHeaders();
  const origin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "http://localhost:5175";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = BASE_URL.startsWith("http")
    ? new URL(`${BASE_URL}${normalizedPath}`)
    : new URL(`${BASE_URL}${normalizedPath}`, origin);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, err.detail || err.message || "Request failed");
  }
  return res.json();
}

export const api = {
  get: (path, params) => request("GET", path, undefined, params),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path)
};

export default api;
