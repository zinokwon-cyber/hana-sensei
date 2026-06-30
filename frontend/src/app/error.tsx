"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
        <p className="text-gray-400 text-sm mb-6">
          예기치 않은 오류가 발생했습니다. 다시 시도해주세요.
        </p>
        <Button variant="brand" onClick={reset}>
          다시 시도
        </Button>
      </div>
    </div>
  );
}
