"use client";

import { useEffect } from "react";
import { Grid3X3, PlusCircle, Loader2, ImageOff } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { EmojiCard } from "@/components/emoji/EmojiCard";
import { Button } from "@/components/ui/button";
import { useEmojiList } from "@/hooks/useEmojis";

export default function MyEmojisPage() {
  const { data, loading, page, fetchEmojis, deleteEmoji } = useEmojiList();

  useEffect(() => {
    fetchEmojis(1);
  }, [fetchEmojis]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="내 이모티콘"
        subtitle={data ? `총 ${data.total}개의 이모티콘` : "이모티콘 목록"}
      />

      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {loading && !data ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-brand-purple mx-auto mb-3" />
                <p className="text-gray-400 text-sm">이모티콘을 불러오는 중...</p>
              </div>
            </div>
          ) : !data?.items.length ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="h-24 w-24 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                <ImageOff className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                아직 생성된 이모티콘이 없어요
              </h3>
              <p className="text-gray-400 text-sm mb-6 max-w-xs">
                이모티콘 생성 메뉴에서 3TOP Buddy 이모티콘을 만들어보세요!
              </p>
              <Button variant="brand" asChild>
                <Link href="/generate">
                  <PlusCircle size={16} />
                  첫 이모티콘 만들기
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Header actions */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Grid3X3 size={16} />
                  <span>
                    {data.total}개 중 {(page - 1) * 12 + 1}–
                    {Math.min(page * 12, data.total)}개 표시
                  </span>
                </div>
                <Button variant="brand" size="sm" asChild>
                  <Link href="/generate">
                    <PlusCircle size={14} />
                    새 이모티콘
                  </Link>
                </Button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {data.items.map((emoji) => (
                  <EmojiCard key={emoji.id} emoji={emoji} onDelete={deleteEmoji} />
                ))}
              </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchEmojis(page - 1)}
                    disabled={page <= 1 || loading}
                  >
                    이전
                  </Button>
                  {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "ghost"}
                      size="sm"
                      onClick={() => fetchEmojis(p)}
                      disabled={loading}
                      className="min-w-[36px]"
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchEmojis(page + 1)}
                    disabled={page >= data.pages || loading}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
