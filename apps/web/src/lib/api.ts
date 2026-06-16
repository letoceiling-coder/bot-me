const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001");

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("botme_token");
}

export function setToken(token: string) {
  localStorage.setItem("botme_token", token);
}

export function clearToken() {
  localStorage.removeItem("botme_token");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Ошибка ${res.status}`);
  }
  return res.json() as Promise<T>;
}
