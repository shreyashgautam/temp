const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:4000";

export type AuthRole = "doctor" | "patient";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  department?: string;
  specialisation?: string;
  specialization?: string;
  specialty?: string;
  patients?: string[];
  phone?: string;
};

type LoginPayload = {
  email: string;
  password: string;
  role: AuthRole;
};

type RegisterPayload = {
  role: AuthRole;
  name: string;
  email: string;
  password: string;
  department?: string;
  specialisation?: string;
  specialization?: string;
  specialty?: string;
  phone?: string;
};

export type AuthResponse = {
  user: AuthUser;
  role: AuthRole;
};

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { error?: string };
      throw new Error(parsed.error || text || `Request failed: ${res.status}`);
    } catch {
      throw new Error(text || `Request failed: ${res.status}`);
    }
  }
  return res.json() as Promise<T>;
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  return fetchApi<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  return fetchApi<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
