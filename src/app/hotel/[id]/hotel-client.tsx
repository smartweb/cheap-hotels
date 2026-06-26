"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/browserFetch";
import { nights, prettyDate } from "@/lib/catalog";
import type { LxHotelRoomsResponse, LxRoomProduct, LxRoomType } from "@/lib/lx/types";
import {
  EmptyState,
  ErrorBanner,
  PrimaryButton,
  ScorePill,
  Skeleton,
} from "@/components/ui";

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><rect width='100%' height='100%' fill='#f2f2f2'/><text x='50%' y='50%' font-size='64' text-anchor='middle' dominant-baseline='middle' fill='#c9c9c9'>🏨</text></svg>`
  );

const BED_LABEL: Record<string, string> = {
  big_bed: "大床",
  twin: "双床",
  multi: "多床",
  unknown: "舒适床型",
  single: "单人床",
};

function bedLabel(t?: string): string | null {
  if (!t) return null;
  if (BED_LABEL[t]) return BED_LABEL[t];
  // 中文直接用，其它英文值兜底
  return /[\u4e00-\u9fa5]/.test(t) ? t : "舒适床型";
}

export function HotelClient({ hotelId }: { hotelId: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const searchOfferId = sp.get("so") ?? "";
  const checkIn = sp.get("ci") ?? "";
  const checkOut = sp.get("co") ?? "";

  const [data, setData] = useState<LxHotelRoomsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ msg: string; auth?: boolean } | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<{
    roomId: string;
    offerId: string;
  } | null>(null);

  const nightCount = checkIn && checkOut ? nights(checkIn, checkOut) : 1;

  const load = useCallback(async () => {
    if (!searchOfferId) {
      setError({ msg: "缺少搜索令牌，请返回列表重新选择酒店" });
      setLoading(false);
      return;
    }
    setLoading(true);
    const r = await api<LxHotelRoomsResponse>("/api/rooms", { search_offer_id: searchOfferId });
    setLoading(false);
    if (r.ok && r.data) setData(r.data);
    else setError({ msg: r.error ?? "加载房型失败", auth: r.authRelated });
  }, [searchOfferId]);

  useEffect(() => {
    load();
  }, [load]);

  // 最低价产品，便于默认选中
  const cheapestProduct = useMemo(() => {
    if (!data) return null;
    let best: { room: LxRoomType; p: LxRoomProduct } | null = null;
    for (const room of data.room_types ?? []) {
      for (const p of room.products ?? []) {
        if (!best || p.price < best.p.price) best = { room, p };
      }
    }
    return best;
  }, [data]);

  // 默认选中最低价
  useEffect(() => {
    if (cheapestProduct && !selectedOffer) {
      setSelectedOffer({
        roomId: cheapestProduct.room.room_type_id,
        offerId: cheapestProduct.p.offer_id,
      });
    }
  }, [cheapestProduct, selectedOffer]);

  const selectedDetail = useMemo(() => {
    if (!data || !selectedOffer) return null;
    for (const room of data.room_types ?? []) {
      const p = (room.products ?? []).find((x) => x.offer_id === selectedOffer.offerId);
      if (p) return { room, p };
    }
    return null;
  }, [data, selectedOffer]);

  const goCheckout = () => {
    if (!selectedDetail) return;
    const q = new URLSearchParams({
      so: searchOfferId,
      ci: checkIn,
      co: checkOut,
      oid: selectedDetail.p.offer_id,
      rn: selectedDetail.room.room_name,
      rt: selectedDetail.room.room_type_id,
    });
    router.push(`/checkout?${q.toString()}`);
  };

  return (
    <main className="pb-[96px] min-h-screen">
      {/* —— 顶部封面 + 返回 —— */}
      <div className="relative aspect-[16/11] bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FALLBACK_IMG}
          alt=""
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => router.back()}
          aria-label="返回"
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-canvas/90 backdrop-blur flex items-center justify-center text-ink shadow-card focus-ring pt-safe"
        >
          ‹
        </button>
      </div>

      <div className="px-4 -mt-6 relative">
        <div className="bg-canvas rounded-lg border border-line shadow-card p-4">
          <h1 className="text-[19px] font-semibold tracking-tightish text-ink leading-snug">
            {data?.hotel_name ?? "酒店详情"}
          </h1>
          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-sub">
            <ScorePill />
            <span className="text-faint">
              {checkIn && checkOut ? `${prettyDate(checkIn)} → ${prettyDate(checkOut)} · ${nightCount}晚` : ""}
            </span>
          </div>
        </div>
      </div>

      <section className="px-4 pt-4">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[15px] font-semibold text-ink">选择房型</h2>
          {data?.room_types && <span className="text-[12px] text-faint">{data.room_types.length} 种房型</span>}
        </div>

        {loading && (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-lg border border-line bg-canvas p-3.5 space-y-2.5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && <ErrorBanner message={error.msg} authRelated={error.auth} />}

        {!loading && !error && data && (data.room_types?.length ?? 0) === 0 && (
          <EmptyState emoji="🛏️" title="暂无可订房型" hint="该酒店当日可能满房，换个日期试试。" />
        )}

        {!loading && !error && data && (
          <div className="space-y-3">
            {(data.room_types ?? []).map((room) => (
              <article
                key={room.room_type_id}
                className="rounded-lg border border-line bg-canvas p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">{room.room_name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-sub">
                      {bedLabel(room.bed_type) && <span className="tag">{bedLabel(room.bed_type)}</span>}
                      {room.area != null && <span className="tag">{room.area}㎡</span>}
                      {room.has_window != null && (
                        <span className={`tag ${room.has_window ? "" : "text-faint"}`}>
                          {room.has_window ? "有窗" : "无窗"}
                        </span>
                      )}
                      {room.max_occupancy != null && (
                        <span className="tag">可住{room.max_occupancy}人</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {(room.products ?? [])
                    .slice()
                    .sort((a, b) => a.price - b.price)
                    .map((p) => {
                      const active = selectedOffer?.offerId === p.offer_id;
                      return (
                        <button
                          key={p.offer_id}
                          onClick={() => setSelectedOffer({ roomId: room.room_type_id, offerId: p.offer_id })}
                          className={`btn-press w-full flex items-center justify-between gap-3 p-3 rounded-md border text-left focus-ring ${
                            active ? "border-ink bg-blue-soft/40" : "border-line bg-surface hover:bg-canvas"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-ink truncate">
                              {p.product_name ?? "标准价"}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                              {p.has_breakfast ? (
                                <span className="text-green">含早餐</span>
                              ) : (
                                <span className="text-faint">无早</span>
                              )}
                              <span className="text-lineHover">·</span>
                              {p.refundable ? (
                                <span className="text-green">限时取消</span>
                              ) : (
                                <span className="text-red">不可取消</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right leading-none">
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-[12px] text-tertiary font-semibold">¥</span>
                                <span className="text-[18px] font-semibold text-ink font-mono">
                                  {p.price}
                                </span>
                              </div>
                              <div className="text-[10px] text-faint mt-0.5">/晚</div>
                            </div>
                            <span
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                active ? "border-ink bg-ink" : "border-line"
                              }`}
                            >
                              {active && <span className="w-2 h-2 rounded-full bg-canvas" />}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* —— 底部下单栏 —— */}
      {selectedDetail && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-h5 bg-canvas border-t border-line shadow-bar z-30 bar-safe">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="leading-tight">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[13px] text-tertiary font-semibold">¥</span>
                <span className="text-[24px] font-semibold text-ink font-mono">
                  {(selectedDetail.p.price * nightCount).toLocaleString()}
                </span>
                <span className="text-[11px] text-faint">/ {nightCount}晚</span>
              </div>
              <div className="text-[11px] text-sub line-clamp-1 max-w-[180px]">
                {selectedDetail.room.room_name} · {selectedDetail.p.product_name ?? "标准价"}
              </div>
            </div>
            <PrimaryButton onClick={goCheckout} className="px-6">
              预订 · 去支付
            </PrimaryButton>
          </div>
        </div>
      )}
    </main>
  );
}
