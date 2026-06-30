"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import type {
  AdminDashboard,
  AdminEmojiListResponse,
  AdminUserListResponse,
  DailyReportItem,
  HourlyReportItem,
  StyleReportItem,
  WeekdayReportItem,
} from "@/types";

export function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setData(await adminApi.getDashboard());
    } catch {
      toast.error("대시보드 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, fetch };
}

export function useAdminReports() {
  const [daily, setDaily] = useState<DailyReportItem[]>([]);
  const [weekday, setWeekday] = useState<WeekdayReportItem[]>([]);
  const [hourly, setHourly] = useState<HourlyReportItem[]>([]);
  const [style, setStyle] = useState<StyleReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (days = 30) => {
    setLoading(true);
    try {
      const [d, w, h, s] = await Promise.all([
        adminApi.getDailyReport(days),
        adminApi.getWeekdayReport(),
        adminApi.getHourlyReport(),
        adminApi.getStyleReport(),
      ]);
      setDaily(d);
      setWeekday(w);
      setHourly(h);
      setStyle(s);
    } catch {
      toast.error("리포트 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { daily, weekday, hourly, style, loading, fetch };
}

export function useAdminUsers() {
  const [data, setData] = useState<AdminUserListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const fetch = useCallback(async (p = 1, q = "") => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers(p, 20, q);
      setData(res);
      setPage(p);
      setSearch(q);
    } catch {
      toast.error("사용자 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleAdmin = useCallback(
    async (userId: string, isAdmin: boolean) => {
      try {
        await adminApi.toggleAdmin(userId, isAdmin);
        toast.success(isAdmin ? "관리자로 지정했습니다." : "관리자를 해제했습니다.");
        await fetch(page, search);
      } catch {
        toast.error("권한 변경에 실패했습니다.");
      }
    },
    [fetch, page, search]
  );

  return { data, loading, page, search, fetch, toggleAdmin };
}

export function useAdminEmojis() {
  const [data, setData] = useState<AdminEmojiListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const fetch = useCallback(async (p = 1, q = "") => {
    setLoading(true);
    try {
      const res = await adminApi.listEmojis(p, 20, q);
      setData(res);
      setPage(p);
      setSearch(q);
    } catch {
      toast.error("이모티콘 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEmoji = useCallback(
    async (id: string) => {
      try {
        await adminApi.deleteEmoji(id);
        toast.success("삭제되었습니다.");
        await fetch(page, search);
      } catch {
        toast.error("삭제에 실패했습니다.");
      }
    },
    [fetch, page, search]
  );

  return { data, loading, page, search, fetch, deleteEmoji };
}
