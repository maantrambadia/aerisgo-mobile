import { getToken } from "./storage";

export const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/"
).replace(/\/$/, "");

export async function apiFetch(
  path,
  { method = "GET", headers = {}, json, auth = true } = {}
) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const h = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...headers,
  };

  if (auth !== false) {
    const token = await getToken();
    if (token) h.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers: h,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = (data && data.message) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    // Preserve requiresDocument flag for document validation errors
    if (data && data.requiresDocument) {
      err.requiresDocument = true;
    }
    throw err;
  }

  return { status: res.status, data };
}
