"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAdminEmojis } from "@/hooks/useAdmin";

const STYLE_BADGE: Record<string, string> = {
  기본: "bg-purple-100 text-purple-700",
  귀여움: "bg-pink-100 text-pink-700",
  집중: "bg-blue-100 text-blue-700",
  행복: "bg-orange-100 text-orange-700",
};

export default function AdminEmojisPage() {
  const router = useRouter();
  const { user: me } = useAuth();
  const { data, loading, page, fetch, deleteEmoji } = useAdminEmojis();
  const [searchInput, setSearchInput] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (me && !me.is_admin) router.push("/generate");
  }, [me, router]);

  useEffect(() => {
    if (me?.is_admin) fetch(1, "");
  }, [me, fetch]);

  if (!me?.is_admin) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(1, searchInput);
  };

  const handleDelete = async (id: string) => {
    await deleteEmoji(id);
    setConfirmId(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="이모티콘 관리" subtitle="전체 이모티콘 조회 및 삭제" />

      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="제목, 사용자 이름 또는 이메일로 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 text-sm font-medium bg-brand-gradient text-white rounded-lg hover:opacity-90"
            >
              검색
            </button>
          </form>

          {/* Table */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <p className="text-center text-gray-400 text-sm py-16">불러오는 중...</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">미리보기</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">제목</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">스타일</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">생성자</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">생성일</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data?.items.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2">
                          <img
                            src={e.image_url}
                            alt={e.title}
                            className="h-12 w-12 rounded-lg object-contain bg-gray-100"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{e.title}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              STYLE_BADGE[e.style] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {e.style}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900">{e.user_name}</p>
                          <p className="text-xs text-gray-400">{e.user_email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(e.created_at).toLocaleDateString("ko-KR")}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {confirmId === e.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleDelete(e.id)}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600"
                              >
                                확인
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="px-2 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmId(e.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!data?.items.length && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                          이모티콘이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetch(page - 1, searchInput)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                이전
              </button>
              <span className="text-sm text-gray-600">
                {page} / {data.pages}
              </span>
              <button
                disabled={page >= data.pages}
                onClick={() => fetch(page + 1, searchInput)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          )}

          {data && (
            <p className="text-center text-xs text-gray-400">전체 {data.total.toLocaleString()}개</p>
          )}
        </div>
      </div>
    </div>
  );
}
