const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000';

export function apiAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  try { return new URL(path, `${new URL(BASE_URL).origin}/`).toString(); }
  catch { return path; }
}

const TOKEN_KEY = 'bd_token';

let token: string | null = null;
try {
  token = window.localStorage.getItem(TOKEN_KEY);
} catch {
  token = null;
}

let activeTenantId: string | null = null;
const tenantListeners = new Set<() => void>();

export function setApiToken(value: string | null) {
  token = value;
  try {
    if (value) window.localStorage.setItem(TOKEN_KEY, value);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable (private mode) — token kept in memory only
  }
}

export function getApiToken(): string | null {
  return token;
}

export function setApiTenant(tenantId: string | null) {
  if (tenantId === activeTenantId) return;
  activeTenantId = tenantId;
  queueMicrotask(() => tenantListeners.forEach((listener) => listener()));
}

export function subscribeApiTenantChanges(listener: () => void): () => void {
  tenantListeners.add(listener);
  return () => tenantListeners.delete(listener);
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string | string[]>;

  constructor(status: number, message: string, errors?: Record<string, string | string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (activeTenantId) headers['X-Tenant-ID'] = activeTenantId;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the API server. Is the backend running?');
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const err = (payload ?? {}) as { message?: string; errors?: Record<string, string | string[]> };
    if (token && response.status === 403 && err.message === 'Business is suspended') {
      window.dispatchEvent(new CustomEvent('auth:business-suspended', { detail: { message: err.message } }));
    }
    throw new ApiError(
      response.status,
      err.message || `Request failed (${response.status})`,
      err.errors
    );
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string, params?: Record<string, unknown>) => request<T>('GET', path, undefined, params),
  post: <T>(path: string, body?: unknown, params?: Record<string, unknown>) => request<T>('POST', path, body, params),
  patch: <T>(path: string, body?: unknown, params?: Record<string, unknown>) => request<T>('PATCH', path, body, params),
  put: <T>(path: string, body?: unknown, params?: Record<string, unknown>) => request<T>('PUT', path, body, params),
  del: <T>(path: string, params?: Record<string, unknown>) => request<T>('DELETE', path, undefined, params),
  upload: async <T>(path: string, file: File, field = 'file'): Promise<T> => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (activeTenantId) headers['X-Tenant-ID'] = activeTenantId;
    const form = new FormData();
    form.append(field, file);
    let response: Response;
    try { response = await fetch(buildUrl(path), { method: 'POST', headers, body: form }); }
    catch { throw new ApiError(0, 'Cannot reach the API server. Is the backend running?'); }
    const payload = await response.json().catch(() => ({})) as { message?: string };
    if (!response.ok) throw new ApiError(response.status, payload.message || `Request failed (${response.status})`);
    return payload as T;
  },
  baseUrl: BASE_URL,
};
