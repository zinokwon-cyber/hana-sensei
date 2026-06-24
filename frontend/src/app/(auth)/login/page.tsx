"use client";

import { useEffect, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Zap, Sparkles, Users, Palette, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAzureLoginUrl, isAuthenticated, saveAuthData } from "@/lib/auth";
import { useRouter } from "next/navigation";
import axios from "axios";

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const [mockLoading, setMockLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/generate");
    }
  }, [router]);

  const handleLogin = () => {
    window.location.href = getAzureLoginUrl();
  };

  const handleMockLogin = async () => {
    setMockLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/mock/login?user_index=0`);
      saveAuthData(res.data.access_token, res.data.user);
      router.push("/generate");
    } catch {
      alert("Mock 로그인 실패 — 백엔드가 실행 중인지 확인해주세요.");
    } finally {
      setMockLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, text: "AI 기반 맞춤 이모티콘 생성" },
    { icon: Palette, text: "3TOP 브랜드 캐릭터 활용" },
    { icon: Users, text: "업무 상태 표현에 최적화" },
    { icon: Shield, text: "사내 전용 보안 서비스" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-gradient flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">3TOP</p>
            <p className="text-white text-lg font-bold leading-tight">Emoji Studio</p>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            업무를 더 재미있게,
            <br />
            <span className="text-white/80">3TOP Buddy와 함께</span>
          </h2>
          <p className="text-white/70 text-lg mb-10 leading-relaxed">
            AI가 만들어주는 우리 회사만의 이모티콘으로
            <br />
            업무 커뮤니케이션을 더욱 생동감 있게 표현하세요.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.text} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-white/85 text-sm font-medium">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-white/40 text-xs relative z-10">
          © 2024 3TOP Co., Ltd. All rights reserved.
        </p>
      </div>

      {/* Right: Login Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient shadow">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-purple uppercase tracking-widest">3TOP</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">Emoji Studio</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
              <p className="text-sm text-gray-500 mt-2">
                3TOP 회사 계정으로 로그인하세요
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
                {error === "auth_failed"
                  ? "인증에 실패했습니다. 다시 시도해주세요."
                  : "오류가 발생했습니다."}
              </div>
            )}

            {/* Mock mode banner */}
            {isMockMode && (
              <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 text-center">
                <FlaskConical className="inline h-3.5 w-3.5 mr-1 mb-0.5" />
                데모 모드 — 실제 API 키 없이 UI를 체험합니다
              </div>
            )}

            <Button
              variant="brand"
              size="lg"
              className="w-full gap-3"
              onClick={handleLogin}
              disabled={isMockMode}
            >
              <svg viewBox="0 0 21 21" className="h-5 w-5" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              Microsoft 계정으로 로그인
            </Button>

            {/* Mock login button */}
            {isMockMode && (
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 mt-3"
                onClick={handleMockLogin}
                disabled={mockLoading}
              >
                <FlaskConical className="h-4 w-4" />
                {mockLoading ? "로그인 중..." : "데모 계정으로 시작하기"}
              </Button>
            )}

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                {isMockMode
                  ? "데모 모드에서는 Microsoft 로그인 대신\n데모 계정으로 UI를 체험할 수 있습니다."
                  : "Microsoft Entra ID (Azure AD)를 통해\n안전하게 인증됩니다"}
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            3TOP 임직원 전용 서비스입니다.
            <br />
            문의: IT팀 (it-support@3top.co.kr)
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
