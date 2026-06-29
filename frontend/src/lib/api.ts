import axios from "axios";
import type {
  AdminDashboard,
  AdminEmojiListResponse,
  AdminUserListResponse,
  DailyReportItem,
  Emoji,
  EmojiListResponse,
  EmojiStyle,
  HourlyReportItem,
  StyleReportItem,
  TokenResponse,
  User,
  WeekdayReportItem,
} from "@/types";

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

export const adminApi = {
  getDashboard: (): Promise<AdminDashboard> =>
    api.get<AdminDashboard>("/api/admin/dashboard").then((r) => r.data),

  getDailyReport: (days = 30): Promise<DailyReportItem[]> =>
    api.get<DailyReportItem[]>("/api/admin/reports/daily", { params: { days } }).then((r) => r.data),

  getWeekdayReport: (): Promise<WeekdayReportItem[]> =>
    api.get<WeekdayReportItem[]>("/api/admin/reports/by-weekday").then((r) => r.data),

  getHourlyReport: (): Promise<HourlyReportItem[]> =>
    api.get<HourlyReportItem[]>("/api/admin/reports/by-hour").then((r) => r.data),

  getStyleReport: (): Promise<StyleReportItem[]> =>
    api.get<StyleReportItem[]>("/api/admin/reports/by-style").then((r) => r.data),

  listUsers: (page = 1, size = 20, search = ""): Promise<AdminUserListResponse> =>
    api
      .get<AdminUserListResponse>("/api/admin/users", { params: { page, size, search } })
      .then((r) => r.data),

  toggleAdmin: (userId: string, isAdmin: boolean): Promise<void> =>
    api
      .patch(`/api/admin/users/${userId}/admin`, null, { params: { is_admin: isAdmin } })
      .then(() => undefined),

  listEmojis: (page = 1, size = 20, search = ""): Promise<AdminEmojiListResponse> =>
    api
      .get<AdminEmojiListResponse>("/api/admin/emojis", { params: { page, size, search } })
      .then((r) => r.data),

  deleteEmoji: (id: string): Promise<void> =>
    api.delete(`/api/admin/emojis/${id}`).then(() => undefined),
};

export default api;
