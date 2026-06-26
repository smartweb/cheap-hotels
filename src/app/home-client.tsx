"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/browserFetch";
import {
  BRANDS,
  CITIES,
  DEFAULT_BRAND,
  DEFAULT_CITY_CODE,
  addDays,
  nights,
  prettyDate,
  today,
} from "@/lib/catalog";
import type { LxHotelItem } from "@/lib/lx/types";
import { HotelCard } from "@/components/HotelCard";
import {
  EmptyState,
  ErrorBanner,
  GhostButton,
  PrimaryButton,
  Sheet,
  Skeleton,
  Spinner,
} from "@/components/ui";
import { NavBar } from "@/components/NavBar";

interface SearchData {
  hotels: LxHotelItem[];
  total: number;
  city: string;
  brand: string;
  used_max_price: number;
  tiers_tried: number[];
}

export function HomeClient() {
  // —— 城市默认深圳 ——
  const [cityCode, setCityCode] = useState(DEFAULT_CITY_CODE);
  const city = useMemo(() => CITIES.find((c) => c.code === cityCode)!, [cityCode]);

  // —— 日期默认今天 ——
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(addDays(today(), 1));

  // —— 品牌默认全季 ——
  const [brand, setBrand] = useState(DEFAULT_BRAND);

  const [cityOpen, setCityOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ msg: string; auth?: boolean } | null>(null);

  const nightCount = nights(checkIn, checkOut);

  const doSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await api<SearchData>("/api/hotels", {
      city_code: cityCode,
      brand,
      check_in: checkIn,
      check_out: checkOut,
      sort_by: "price",
    });
    setLoading(false);
    if (r.ok && r.data) {
      setData(r.data);
    } else {
      setData(null);
      setError({ msg: r.error ?? "搜索失败", auth: r.authRelated });
    }
  }, [cityCode, brand, checkIn, checkOut]);

  // 首次进入 & 任何筛选变化都自动搜索
  useEffect(() => {
    doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityCode, brand, checkIn, checkOut]);

  const dateQuickChips = useMemo(
    () => [
      { label: "今天", ci: today(), co: addDays(today(), 1) },
      { label: "明天", ci: addDays(today(), 1), co: addDays(today(), 2) },
      { label: "后天", ci: addDays(today(), 2), co: addDays(today(), 3) },
      { label: "周末", ci: nextWeekend(), co: addDays(nextWeekend(), 1) },
    ],
    []
  );

  const upgraded = data && data.used_max_price >= 400;

  return (
    <main className="pb-safe min-h-screen">
      {/* —— 顶部品牌头 —— */}
      <header className="sticky top-0 z-20 bg-canvas/90 backdrop-blur-lg border-b border-line pt-safe">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium tracking-[0.18em] uppercase text-faint">
                Budget Brand Hotels
              </div>
              <h1 className="text-[22px] font-semibold tracking-tight text-ink leading-tight">
                特价品牌酒店
              </h1>
            </div>
            <button
              onClick={() => setCityOpen(true)}
              className="btn-press inline-flex items-center gap-1 h-9 px-3 rounded-md border border-line bg-canvas text-[13px] font-medium text-ink focus-ring"
            >
              <span className="text-[15px]">📍</span>
              {city.name}
              <span className="text-faint">▾</span>
            </button>
          </div>

          {/* —— 日期快捷切换 —— */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
            <button
              onClick={() => setDateOpen(true)}
              className="btn-press shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-surface border border-line text-[13px] font-medium text-ink focus-ring"
            >
              <span className="text-tertiary">📅</span>
              <span>{prettyDate(checkIn)}</span>
              <span className="text-faint">→</span>
              <span>{prettyDate(checkOut)}</span>
              <span className="text-faint">·{nightCount}晚</span>
            </button>
          </div>

          {/* —— 品牌切换 —— */}
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
            {BRANDS.map((b) => {
              const active = b.name === brand;
              return (
                <button
                  key={b.name}
                  onClick={() => setBrand(b.name)}
                  className={`btn-press shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] font-medium focus-ring ${
                    active
                      ? "bg-ink text-canvas"
                      : "bg-canvas border border-line text-sub hover:bg-surface"
                  }`}
                >
                  <span className="text-[14px]">{b.emoji}</span>
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* —— 主体 —— */}
      <section className="px-4 pt-3">
        {/* 结果计数 + 价格档提示 */}
        {!loading && !error && data && (
          <div className="flex items-center justify-between text-[12px] text-sub mb-2.5 fade-up">
            <span>
              <span className="font-semibold text-ink font-mono">{data.total}</span> 家 · {brand}
              <span className="text-faint"> · {data.city}</span>
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm ${
                upgraded ? "bg-amber-soft text-amber" : "bg-green-soft text-green"
              }`}
            >
              {upgraded ? `已放宽至 ¥${data.used_max_price}` : `¥${data.used_max_price} 以内`}
            </span>
          </div>
        )}

        {upgraded && (
          <div className="mb-3 rounded-md p-3 bg-amber-soft border border-line text-[12px] text-amber leading-relaxed fade-up">
            300 元内暂无 {brand} 房型，已自动放宽到{" "}
            <span className="font-semibold">¥{data!.used_max_price} 以内</span>，仍保持低价优先。
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-line bg-canvas">
                <Skeleton className="aspect-[16/10] !rounded-none" />
                <div className="p-3.5 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && <ErrorBanner message={error.msg} authRelated={error.auth} />}

        {!loading && !error && data && data.hotels.length === 0 && (
          <EmptyState
            emoji="🔍"
            title={`没有找到 ${brand} 的酒店`}
            hint={`换个品牌，或试试其他日期看看 ${data.city} 还有谁在等你。`}
          />
        )}

        {!loading && !error && data && data.hotels.length > 0 && (
          <div className="space-y-3">
            {data.hotels.map((h) => (
              <div key={h.hotel_id} className="fade-up">
                <HotelCard hotel={h} checkIn={checkIn} checkOut={checkOut} />
              </div>
            ))}
            <p className="text-center text-[12px] text-faint py-4">
              · 价格实时变动，以预订页为准 ·
            </p>
          </div>
        )}
      </section>

      {/* —— 城市选择 —— */}
      <Sheet open={cityOpen} onClose={() => setCityOpen(false)} title="选择城市">
        <div className="p-4 grid grid-cols-2 gap-2.5">
          {CITIES.map((c) => {
            const active = c.code === cityCode;
            return (
              <button
                key={c.code}
                onClick={() => {
                  setCityCode(c.code);
                  setCityOpen(false);
                }}
                className={`btn-press flex flex-col items-start gap-0.5 p-3.5 rounded-md border text-left focus-ring ${
                  active ? "border-ink bg-ink text-canvas" : "border-line bg-canvas text-ink hover:bg-surface"
                }`}
              >
                <span className="text-[17px] font-semibold tracking-tightish">{c.name}</span>
                <span className={`text-[11px] ${active ? "text-canvas/70" : "text-faint"}`}>
                  {c.short} · {BRANDS.map((b) => b.name).join(" / ")}
                </span>
              </button>
            );
          })}
        </div>
        <p className="px-4 pb-5 text-[12px] text-faint leading-relaxed">
          目前仅支持北上广深，默认深圳。三个品牌均有覆盖。
        </p>
      </Sheet>

      {/* —— 日期选择 —— */}
      <Sheet open={dateOpen} onClose={() => setDateOpen(false)} title="入住 / 离店日期">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {dateQuickChips.map((d) => {
              const active = d.ci === checkIn && d.co === checkOut;
              return (
                <button
                  key={d.label}
                  onClick={() => {
                    setCheckIn(d.ci);
                    setCheckOut(d.co);
                    setDateOpen(false);
                  }}
                  className={`btn-press flex flex-col items-start gap-1 p-3 rounded-md border text-left focus-ring ${
                    active ? "border-ink bg-ink text-canvas" : "border-line bg-canvas text-ink hover:bg-surface"
                  }`}
                >
                  <span className="text-[15px] font-semibold">{d.label}</span>
                  <span className={`text-[11px] ${active ? "text-canvas/70" : "text-faint"}`}>
                    {prettyDate(d.ci)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-md border border-line p-3.5 space-y-3">
            <div className="flex items-center gap-3">
              <label className="w-14 text-[13px] text-sub shrink-0">入住</label>
              <input
                type="date"
                value={checkIn}
                min={today()}
                onChange={(e) => {
                  const ci = e.target.value || today();
                  setCheckIn(ci);
                  if (checkOut <= ci) setCheckOut(addDays(ci, 1));
                }}
                className="flex-1 h-10 px-3 rounded-sm border border-line bg-canvas text-[14px] text-ink focus-ring"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-14 text-[13px] text-sub shrink-0">离店</label>
              <input
                type="date"
                value={checkOut}
                min={addDays(checkIn, 1)}
                onChange={(e) => setCheckOut(e.target.value || addDays(checkIn, 1))}
                className="flex-1 h-10 px-3 rounded-sm border border-line bg-canvas text-[14px] text-ink focus-ring"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[12px] text-faint">共 {nightCount} 晚</span>
            <GhostButton
              onClick={() => {
                setDateOpen(false);
                doSearch();
              }}
            >
              确认
            </GhostButton>
          </div>
        </div>
      </Sheet>

      <NavBar />
    </main>
  );
}

/** 本周六（用于周末快捷） */
function nextWeekend(): string {
  const d = new Date();
  const day = d.getDay();
  // 0=日 6=六
  const delta = day === 6 ? 7 : 6 - day;
  d.setDate(d.getDate() + (delta === 0 ? 7 : delta));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
