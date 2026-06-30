"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, ImageIcon, TrendingUp, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAdminDashboard } from "@/hooks/useAdmin";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | null;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {value === null ? "—" : value.toLocaleString()}
            </p>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={22} className="text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, loading, fetch } = useAdminDashboard();

  useEffect(() => {
    if (user && !user.is_admin) {
      router.push("/generate");
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.is_admin) {
      fetch();
    }
  }, [user, fetch]);

  if (!user?.is_admin) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="어드민 대시보드" subtitle="3TOP Emoji Studio 운영 현황" />

      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="전체 사용자"
              value={data?.total_users ?? null}
              icon={Users}
              color="bg-brand-purple"
            />
            <StatCard
              title="전체 이모티콘"
              value={data?.total_emojis ?? null}
              icon={ImageIcon}
              color="bg-blue-500"
            />
            <StatCard
              title="오늘 생성"
              value={data?.today_emojis ?? null}
              icon={Calendar}
              color="bg-emerald-500"
            />
            <StatCard
              title="이번 주 생성"
              value={data?.this_week_emojis ?? null}
              icon={TrendingUp}
              color="bg-orange-500"
            />
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: "/admin/reports", label: "통계 리포트", desc: "일별·요일별·시간대별·스타일별 생성 현황" },
              { href: "/admin/users", label: "사용자 관리", desc: "전체 사용자 조회 및 관리자 권한 설정" },
              { href: "/admin/emojis", label: "이모티콘 관리", desc: "전체 이모티콘 조회 및 삭제" },
            ].map((item) => (
              <Card
                key={item.href}
                className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(item.href)}
              >
                <CardContent className="p-6">
                  <p className="font-semibold text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {loading && (
            <p className="text-center text-gray-400 text-sm py-8">데이터를 불러오는 중...</p>
          )}
        </div>
      </div>
    </div>
  );
}
