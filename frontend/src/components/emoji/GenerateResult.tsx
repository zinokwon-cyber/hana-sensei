"use client";

import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { downloadImage } from "@/lib/utils";
import type { Emoji } from "@/types";

interface GenerateResultProps {
  emoji: Emoji;
  onReset: () => void;
}

export function GenerateResult({ emoji, onReset }: GenerateResultProps) {
  return (
    <div className="flex flex-col items-center gap-6 animate-slide-up">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 px-4 py-2 rounded-full mb-3">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          이모티콘 생성 완료!
        </div>
        <h3 className="text-lg font-bold text-gray-900">{emoji.title}</h3>
        <Badge variant="outline" className="mt-1">
          {emoji.style} 스타일
        </Badge>
      </div>

      {/* Image Display */}
      <div className="relative w-56 h-56 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 overflow-hidden shadow-lg flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={emoji.image_url}
          alt={emoji.title}
          className="object-contain p-4 w-full h-full"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <Button
          variant="brand"
          className="flex-1 gap-2"
          onClick={() => downloadImage(emoji.image_url, `${emoji.title}-${emoji.style}.png`)}
        >
          <Download size={16} />
          PNG 다운로드
        </Button>
        <Button variant="outline" size="icon" onClick={onReset} title="새로 만들기">
          <RotateCcw size={16} />
        </Button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        이모티콘은 <span className="font-medium text-brand-purple">내 이모티콘</span> 메뉴에 자동 저장됩니다.
      </p>
    </div>
  );
}
