"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { emojiApi, mockApi } from "@/lib/api";
import type { Emoji, EmojiListResponse, EmojiStyle } from "@/types";

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export function useEmojiGenerate() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Emoji | null>(null);

  const generate = useCallback(async (title: string, style: EmojiStyle) => {
    setGenerating(true);
    setResult(null);
    try {
      const emoji = isMockMode
        ? await mockApi.generate(title, style)
        : await emojiApi.generate(title, style);
      setResult(emoji);
      toast.success("이모티콘이 생성되었습니다!");
      return emoji;
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "이모티콘 생성에 실패했습니다.";
      toast.error(msg);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generate, generating, result, setResult };
}

export function useEmojiList() {
  const [data, setData] = useState<EmojiListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchEmojis = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await emojiApi.list(pageNum, 12);
      setData(response);
      setPage(pageNum);
    } catch {
      toast.error("이모티콘 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEmoji = useCallback(
    async (id: string) => {
      try {
        await emojiApi.delete(id);
        toast.success("삭제되었습니다.");
        await fetchEmojis(page);
      } catch {
        toast.error("삭제에 실패했습니다.");
      }
    },
    [fetchEmojis, page]
  );

  return { data, loading, page, fetchEmojis, deleteEmoji };
}
