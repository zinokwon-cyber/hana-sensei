"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Shield, ShieldOff } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAdminUsers } from "@/hooks/useAdmin";

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: me } = useAuth();
  const { data, loading, page, fetch, toggleAdmin } = useAdminUsers();
  const [searchInput, setSearchInput] = useState("");

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

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="사용자 관리" subtitle="전체 사용자 조회 및 관리자 권한 설정" />

      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="이름 또는 이메일로 검색"
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
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">이름</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">이메일</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">이모티콘</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">권한</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">가입일</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data?.items.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{u.emoji_count}</td>
                        <td className="px-4 py-3 text-center">
                          {u.is_admin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-gradient-soft text-brand-purple">
                              <Shield size={11} />
                              관리자
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              일반
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(u.created_at).toLocaleDateString("ko-KR")}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {u.id !== me.id && (
                            <button
                              onClick={() => toggleAdmin(u.id, !u.is_admin)}
                              title={u.is_admin ? "관리자 해제" : "관리자 지정"}
                              className={`p-1.5 rounded-md transition-colors ${
                                u.is_admin
                                  ? "text-orange-400 hover:bg-orange-50"
                                  : "text-gray-400 hover:bg-gray-100"
                              }`}
                            >
                              {u.is_admin ? <ShieldOff size={15} /> : <Shield size={15} />}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!data?.items.length && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                          사용자가 없습니다.
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
            <p className="text-center text-xs text-gray-400">전체 {data.total.toLocaleString()}명</p>
          )}
        </div>
      </div>
    </div>
  );
}
