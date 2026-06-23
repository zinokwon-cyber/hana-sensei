"use client";

import { Header } from "@/components/layout/Header";
import { GenerateForm } from "@/components/emoji/GenerateForm";
import { GenerateResult } from "@/components/emoji/GenerateResult";
import { useEmojiGenerate } from "@/hooks/useEmojis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Info } from "lucide-react";

export default function GeneratePage() {
  const { generate, generating, result, setResult } = useEmojiGenerate();

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="이모티콘 생성"
        subtitle="3TOP Buddy AI 이모티콘을 생성해보세요"
      />

      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient-soft">
                      <Sparkles className="h-4 w-4 text-brand-purple" />
                    </div>
                    <div>
                      <CardTitle className="text-base">이모티콘 설정</CardTitle>
                      <CardDescription className="text-xs">업무 상태와 스타일을 선택하세요</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <GenerateForm onGenerate={generate} generating={generating} />
                </CardContent>
              </Card>
            </div>

            {/* Right: Result / Preview */}
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">생성 결과</CardTitle>
                  <CardDescription className="text-xs">생성된 이모티콘이 여기에 표시됩니다</CardDescription>
                </CardHeader>
                <CardContent>
                  {result ? (
                    <GenerateResult emoji={result} onReset={() => setResult(null)} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      {generating ? (
                        <>
                          <div className="relative mb-6">
                            <div className="h-20 w-20 rounded-full bg-brand-gradient-soft flex items-center justify-center">
                              <Sparkles className="h-8 w-8 text-brand-purple animate-pulse" />
                            </div>
                            <div className="absolute inset-0 rounded-full border-4 border-brand-purple/20 animate-ping" />
                          </div>
                          <p className="text-gray-700 font-semibold">AI가 이모티콘을 생성하고 있어요</p>
                          <p className="text-gray-400 text-sm mt-1">약 20-30초 소요됩니다</p>
                          <div className="flex gap-1.5 mt-4">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="h-2 w-2 rounded-full bg-brand-purple"
                                style={{
                                  animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`,
                                }}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <Sparkles className="h-8 w-8 text-gray-300" />
                          </div>
                          <p className="text-gray-500 font-medium">아직 생성된 이모티콘이 없어요</p>
                          <p className="text-gray-400 text-sm mt-1">
                            왼쪽에서 상태를 입력하고 생성 버튼을 눌러보세요
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tips */}
              <div className="flex gap-2.5 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-700">이모티콘 생성 팁</p>
                  <ul className="text-xs text-blue-600 mt-1 space-y-0.5">
                    <li>• 구체적인 상태일수록 더 정확한 이모티콘이 생성됩니다</li>
                    <li>• 생성된 이모티콘은 자동으로 저장됩니다</li>
                    <li>• PNG 형식으로 다운로드하여 카카오톡에서 사용하세요</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
