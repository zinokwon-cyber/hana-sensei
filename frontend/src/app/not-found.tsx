import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-brand-purple mb-4">404</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없어요</h2>
        <p className="text-gray-400 mb-8">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
        <Button variant="brand" asChild>
          <Link href="/generate">
            <Home size={16} />
            홈으로 돌아가기
          </Link>
        </Button>
      </div>
    </div>
  );
}
