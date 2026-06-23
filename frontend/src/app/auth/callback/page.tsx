"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const { handleCallback } = useAuth();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      window.location.href = `/login?error=${encodeURIComponent(error)}`;
      return;
    }

    if (code) {
      handleCallback(code);
    } else {
      window.location.href = "/login?error=no_code";
    }
  }, [searchParams, handleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand-purple" />
        </div>
        <p className="text-gray-700 font-medium">로그인 처리 중...</p>
        <p className="text-gray-400 text-sm mt-1">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
