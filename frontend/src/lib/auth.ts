import { User } from "@/types";

const AZURE_AUTH_URL = `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}/oauth2/v2.0/authorize`;

export function getAzureLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI!,
    scope: "openid profile email User.Read",
    response_mode: "query",
    state: crypto.randomUUID(),
  });
  return `${AZURE_AUTH_URL}?${params.toString()}`;
}

export function saveAuthData(token: string, user: User) {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuthData() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}
