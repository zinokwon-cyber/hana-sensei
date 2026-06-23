"use client";

import { useEffect, useState } from "react";
import { User, Mail, Calendar, Grid3X3, LogOut, Shield } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { emojiApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [emojiCount, setEmojiCount] = useState<number>(0);

  useEffect(() => {
    emojiApi.list(1, 1).then((r) => setEmojiCount(r.total)).catch(() => {});
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="내 정보" subtitle="계정 정보 및 사용 현황" />

      <div className="flex-1 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
            {/* Gradient banner */}
            <div className="h-24 bg-brand-gradient" />
            <CardContent className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-10 mb-6">
                <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <div className="pb-2">
                  <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                  <Badge variant="outline" className="mt-1">
                    3TOP 임직원
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-gray-200">
                    <Mail size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">이메일</p>
                    <p className="text-sm text-gray-900 font-semibold">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-gray-200">
                    <Calendar size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">가입일</p>
                    <p className="text-sm text-gray-900 font-semibold">
                      {user?.created_at ? formatDate(user.created_at) : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">사용 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-brand-gradient-soft border border-brand-purple/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Grid3X3 size={20} className="text-brand-purple" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-brand-purple">{emojiCount}</p>
                  <p className="text-sm text-gray-500">생성된 이모티콘</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">보안 & 인증</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Microsoft Entra ID</p>
                    <p className="text-xs text-gray-400">Azure AD를 통해 인증됨</p>
                  </div>
                </div>
                <Badge variant="success" className="text-xs">
                  연결됨
                </Badge>
              </div>
              <Separator />
              <div className="pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={logout}
                  className="gap-2"
                >
                  <LogOut size={14} />
                  로그아웃
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
