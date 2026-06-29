"use client";

import { useEffect, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Zap, Sparkles, Users, Palette, Eye, EyeOff, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAuthenticated, saveAuthData } from "@/lib/auth";
import { useRouter } from "next/navigation";
import axios from "axios";

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || "password";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) router.replace("/generate");
  }, [router]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login-password`, { email, password });
      saveAuthData(res.data.access_token, res.data.user);
      router.push("/generate");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setFormError(msg || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (password.length < 8) {
      setFormError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, { email, name, password });
      saveAuthData(res.data.access_token, res.data.user);
      router.push("/generate");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setFormError(msg || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/mock/login?user_index=0`);
      saveAuthData(res.data.access_token, res.data.user);
      router.push("/generate");
    } catch {
      setFormError("Mock 로그인 실패 — 백엔드가 실행 중인지 확인해주세요.");
    } finally {
      setLoading(false);
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

      {/* Right: Login/Register Panel */}
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
            {/* Tab switcher */}
            {authMode === "password" && !isMockMode && (
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
                <button
                  onClick={() => { setTab("login"); setFormError(""); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    tab === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                >
                  로그인
                </button>
                <button
                  onClick={() => { setTab("register"); setFormError(""); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    tab === "register" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                >
                  회원가입
                </button>
              </div>
            )}

            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {tab === "login" ? "로그인" : "회원가입"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">3TOP 임직원 전용 서비스</p>
            </div>

            {(error || formError) && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
                {formError || (error === "auth_failed" ? "인증에 실패했습니다." : "오류가 발생했습니다.")}
              </div>
            )}

            {isMockMode ? (
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={handleMockLogin}
                disabled={loading}
              >
                <FlaskConical className="h-4 w-4" />
                {loading ? "로그인 중..." : "데모 계정으로 시작하기"}
              </Button>
            ) : authMode === "password" ? (
              <form onSubmit={tab === "login" ? handlePasswordLogin : handleRegister} className="space-y-4">
                {tab === "register" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="홍길동"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hong@3top.co.kr"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tab === "register" ? "8자 이상" : "비밀번호 입력"}
                      className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="brand"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "처리 중..." : tab === "login" ? "로그인" : "가입하기"}
                </Button>
              </form>
            ) : (
              /* Azure AD mode */
              <Button
                variant="brand"
                size="lg"
                className="w-full gap-3"
                onClick={() => {
                  const { getAzureLoginUrl } = require("@/lib/auth");
                  window.location.href = getAzureLoginUrl();
                }}
              >
                <svg viewBox="0 0 21 21" className="h-5 w-5" fill="none">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                Microsoft 계정으로 로그인
              </Button>
            )}
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
