/**
 * Base del API del back (sin path extra después de `/api`).
 * Ejemplo: `https://back-bidnow.onrender.com/api`
 *
 * En `.env` o variables de Render, define una de:
 * - `VITE_API_BASE_URL` (recomendado en Vite)
 * - `FRONTEND_API_BASE_URL`
 * - `REACT_APP_API_URL` (nombre típico de CRA; aquí expuesto vía `envPrefix` en vite.config)
 */
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  (import.meta.env.FRONTEND_API_BASE_URL as string | undefined)?.trim() ||
  (import.meta.env.REACT_APP_API_URL as string | undefined)?.trim() ||
  "https://back-bidnow.onrender.com/api";

export class ApiError extends Error {
  status: number;
  endpoint: string;
  details: unknown;

  constructor(message: string, status: number, endpoint: string, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.endpoint = endpoint;
    this.details = details;
  }
}

/**
 * Une base del API + path. Si la base ya incluye `/api` y el path empieza por `/api/…`,
 * no duplicar segmentos (evita `…/api/api/personas/` cuando `VITE_API_BASE_URL` termina en `/api`).
 */
function joinUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const baseStr = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  let normalizedPath = path.startsWith("/") ? path : `/${path}`;

  try {
    const baseUrl = new URL(baseStr.includes("://") ? baseStr : `https://${baseStr}`);
    const prefix = baseUrl.pathname.replace(/\/$/, "") || "";
    if (prefix && normalizedPath.startsWith(`${prefix}/`)) {
      normalizedPath = normalizedPath.slice(prefix.length);
      if (!normalizedPath.startsWith("/")) {
        normalizedPath = `/${normalizedPath}`;
      }
    }
    const originAndBasePath = `${baseUrl.origin}${prefix}`;
    return `${originAndBasePath}${normalizedPath}`;
  } catch {
    if (/\/api$/i.test(baseStr) && normalizedPath.startsWith("/api/")) {
      normalizedPath = normalizedPath.slice(4);
    }
    return `${baseStr}${normalizedPath}`;
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function fieldErrorsToMessage(data: Record<string, unknown>): string | null {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key === "detail" || key === "message" || key === "error") {
      continue;
    }
    if (Array.isArray(value) && value.length > 0) {
      parts.push(`${key}: ${String(value[0])}`);
    } else if (typeof value === "string" && value.trim()) {
      parts.push(`${key}: ${value}`);
    }
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

function getErrorMessage(status: number, payload: unknown): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    const priorityFields = ["detail", "message", "error", "non_field_errors"];
    for (const field of priorityFields) {
      const value = data[field];
      if (typeof value === "string") {
        return value;
      }
      if (Array.isArray(value) && value.length > 0) {
        return String(value[0]);
      }
    }
    const fromFields = fieldErrorsToMessage(data);
    if (fromFields) {
      return fromFields;
    }
    return JSON.stringify(payload);
  }
  if (status >= 500) {
    return "Error del servidor. Intenta nuevamente.";
  }
  return `Error HTTP ${status}`;
}

type RequestConfig = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(path: string, config: RequestConfig = {}): Promise<T> {
  const url = joinUrl(path);
  const { body, headers, ...rest } = config;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de red";
    throw new ApiError(
      `No se pudo conectar con el backend (${API_BASE_URL}). ${message}`,
      0,
      path,
      null,
    );
  }

  const payload = await parseResponseBody(response);
  if (!response.ok) {
    throw new ApiError(getErrorMessage(response.status, payload), response.status, path, payload);
  }

  return payload as T;
}

export const httpClient = {
  get: <T>(path: string, init?: Omit<RequestConfig, "body" | "method">) =>
    apiRequest<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, body?: unknown, init?: Omit<RequestConfig, "body" | "method">) =>
    apiRequest<T>(path, { ...init, method: "POST", body }),
  put: <T>(path: string, body?: unknown, init?: Omit<RequestConfig, "body" | "method">) =>
    apiRequest<T>(path, { ...init, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, init?: Omit<RequestConfig, "body" | "method">) =>
    apiRequest<T>(path, { ...init, method: "PATCH", body }),
  delete: <T>(path: string, init?: Omit<RequestConfig, "body" | "method">) =>
    apiRequest<T>(path, { ...init, method: "DELETE" }),
};

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
