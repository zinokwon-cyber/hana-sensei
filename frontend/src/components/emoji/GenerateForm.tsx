"use client";

import { useState } from "react";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmojiStyle } from "@/types";
import { EMOJI_STYLES, STATUS_PRESETS } from "@/types";

interface GenerateFormProps {
  onGenerate: (title: string, style: EmojiStyle) => Promise<unknown>;
  generating: boolean;
}

export function GenerateForm({ onGenerate, generating }: GenerateFormProps) {
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState<EmojiStyle>("기본");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || generating) return;
    await onGenerate(title.trim(), style);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Input */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
          상태 입력
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 회의중, 출장중, 휴가중..."
          className="h-11 text-base"
          maxLength={50}
          disabled={generating}
        />
        <p className="text-xs text-gray-400">{title.length}/50</p>
      </div>

      {/* Preset Tags */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">빠른 선택</Label>
        <div className="flex flex-wrap gap-2">
          {STATUS_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setTitle(preset)}
              disabled={generating}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
                title === preset
                  ? "bg-brand-gradient text-white border-transparent shadow-sm"
                  : "border-gray-200 text-gray-600 hover:border-brand-purple hover:text-brand-purple bg-white"
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Style Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">스타일 선택</Label>
        <div className="grid grid-cols-2 gap-3">
          {EMOJI_STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStyle(s.value)}
              disabled={generating}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-xl border-2 p-3 text-left transition-all duration-150",
                style === s.value
                  ? "border-brand-purple bg-brand-gradient-soft shadow-sm"
                  : "border-gray-200 bg-white hover:border-brand-purple/50"
              )}
            >
              <span
                className={cn(
                  "text-sm font-semibold",
                  style === s.value ? "text-brand-purple" : "text-gray-800"
                )}
              >
                {s.label}
              </span>
              <span className="text-xs text-gray-500 leading-tight">{s.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="w-full gap-2"
        disabled={!title.trim() || generating}
      >
        {generating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            AI가 이모티콘을 생성하는 중...
          </>
        ) : (
          <>
            <Wand2 className="h-5 w-5" />
            이모티콘 생성하기
          </>
        )}
      </Button>

      {generating && (
        <p className="text-center text-xs text-gray-400 animate-pulse">
          AI가 3TOP Buddy 이모티콘을 그리고 있어요. 약 20-30초 소요됩니다.
        </p>
      )}
    </form>
  );
}
