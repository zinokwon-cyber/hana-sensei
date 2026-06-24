import axios from "axios";
import type { Emoji, EmojiListResponse, EmojiStyle, TokenResponse, User } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (code: string): Promise<TokenResponse> =>
    api.post<TokenResponse>(`/api/auth/login?code=${code}`).then((r) => r.data),

  getMe: (): Promise<User> =>
    api.get<User>("/api/auth/me").then((r) => r.data),
};

export const mockApi = {
  login: (userIndex = 0): Promise<TokenResponse> =>
    api.post<TokenResponse>(`/api/mock/login?user_index=${userIndex}`).then((r) => r.data),

  generate: (title: string, style: EmojiStyle): Promise<Emoji> =>
    api
      .post<Emoji>("/api/mock/emojis/generate", { title, style })
      .then((r) => r.data),
};

export const emojiApi = {
  generate: (title: string, style: EmojiStyle): Promise<Emoji> =>
    api
      .post<Emoji>("/api/emojis/generate", { title, style })
      .then((r) => r.data),

  list: (page = 1, size = 12): Promise<EmojiListResponse> =>
    api
      .get<EmojiListResponse>("/api/emojis", { params: { page, size } })
      .then((r) => r.data),

  get: (id: string): Promise<Emoji> =>
    api.get<Emoji>(`/api/emojis/${id}`).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/emojis/${id}`).then(() => undefined),
};

export default api;
