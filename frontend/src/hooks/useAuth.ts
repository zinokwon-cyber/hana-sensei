"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import { authApi } from "@/lib/api";
import { saveAuthData, clearAuthData, getStoredUser, getStoredToken } from "@/lib/auth";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getStoredToken();
    if (storedUser && token) {
      setUser(storedUser);
      // Verify token is still valid
      authApi.getMe().then(setUser).catch(() => {
        clearAuthData();
        setUser(null);
      });
    }
    setLoading(false);
  }, []);

  const handleCallback = useCallback(
    async (code: string) => {
      try {
        const response = await authApi.login(code);
        saveAuthData(response.access_token, response.user);
        setUser(response.user);
        router.push("/generate");
      } catch (error) {
        console.error("Login failed:", error);
        router.push("/login?error=auth_failed");
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    clearAuthData();
    setUser(null);
    router.push("/login");
  }, [router]);

  return { user, loading, handleCallback, logout };
}
