"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAdminReports } from "@/hooks/useAdmin";
import type { DailyReportItem, HourlyReportItem, StyleReportItem, WeekdayReportItem } from "@/types";

type Tab = "daily" | "weekday" | "hourly" | "style";

const STYLE_COLORS: Record<string, string> = {
  기본: "bg-brand-purple",
  귀여움: "bg-pink-500",
  집중: "bg-blue-500",
  행복: "bg-orange-400",
};

function BarChart({ items, max }: { items: { label: string; count: number }[]; max: number }) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-14 text-right text-xs text-gray-500 shrink-0">{item.label}</span>
          <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden">
            <div
              className="h-full bg-brand-gradient rounded-md transition-all duration-500"
              style={{ width: max > 0 ? `${(item.count / max) * 100}%` : "0%" }}
            />
          </div>
          <span className="w-8 text-xs text-gray-600 font-medium shrink-0">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function DailyChart({ data }: { data: DailyReportItem[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const visible = data.slice(-30);
  return (
    <div>
      <div className="flex items-end gap-1 h-40">
        {visible.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
            <div
              className="w-full bg-brand-gradient rounded-t-sm transition-all duration-300"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? "4px" : "0" }}
              title={`${d.date}: ${d.count}건`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">{visible[0]?.date ?? ""}</span>
        <span className="text-xs text-gray-400">{visible[visible.length - 1]?.date ?? ""}</span>
      </div>
    </div>
  );
}

function WeekdayChart({ data }: { data: WeekdayReportItem[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <BarChart
      items={data.map((d) => ({ label: d.weekday_label, count: d.count }))}
      max={max}
    />
  );
}

function HourlyChart({ data }: { data: HourlyReportItem[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const peak = data.reduce((a, b) => (a.count >= b.count ? a : b), data[0]);
  return (
    <div>
      <div className="flex items-end gap-0.5 h-40">
        {data.map((d) => (
          <div key={d.hour} className="flex-1 flex flex-col items-center justify-end h-full">
            <div
              className="w-full bg-blue-400 rounded-t-sm transition-all duration-300"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? "4px" : "0" }}
              title={`${d.hour}시: ${d.count}건`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">0시</span>
        <span className="text-xs text-gray-400">23시</span>
      </div>
      {peak && (
        <p className="text-xs text-gray-500 mt-3">
          최다 생성 시간대: <span className="font-semibold text-gray-700">{peak.hour}시</span> ({peak.count}건)
        </p>
      )}
    </div>
  );
}

function StyleChart({ data }: { data: StyleReportItem[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.style} className="flex items-center gap-3">
          <span className="w-12 text-xs text-gray-500 shrink-0">{d.style}</span>
          <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden">
            <div
              className={`h-full rounded-md transition-all duration-500 ${STYLE_COLORS[d.style] ?? "bg-gray-400"}`}
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="w-20 text-xs text-gray-600 font-medium shrink-0">
            {d.count}건 ({d.percentage}%)
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { daily, weekday, hourly, style, loading, fetch } = useAdminReports();
  const [tab, setTab] = useState<Tab>("daily");
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (user && !user.is_admin) router.push("/generate");
  }, [user, router]);

  useEffect(() => {
    if (user?.is_admin) fetch(days);
  }, [user, fetch, days]);

  if (!user?.is_admin) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "daily", label: "일별 현황" },
    { key: "weekday", label: "요일별 현황" },
    { key: "hourly", label: "시간대별 현황" },
    { key: "style", label: "스타일별 현황" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="통계 리포트" subtitle="이모티콘 생성 현황 분석" />

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tab bar */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === t.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Daily period selector */}
          {tab === "daily" && (
            <div className="flex gap-2">
              {[7, 14, 30, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    days === d
                      ? "border-brand-purple bg-brand-gradient-soft text-brand-purple font-semibold"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  최근 {d}일
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <p className="text-center text-gray-400 text-sm py-16">데이터를 불러오는 중...</p>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {tabs.find((t) => t.key === tab)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {tab === "daily" && daily.length > 0 && <DailyChart data={daily} />}
                {tab === "daily" && daily.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">데이터가 없습니다.</p>
                )}
                {tab === "weekday" && <WeekdayChart data={weekday} />}
                {tab === "hourly" && hourly.length > 0 && <HourlyChart data={hourly} />}
                {tab === "style" && style.length > 0 && <StyleChart data={style} />}
                {(tab === "hourly" || tab === "style") && (tab === "hourly" ? hourly : style).length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">데이터가 없습니다.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
