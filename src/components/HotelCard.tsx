"use client";

import Link from "next/link";
import type { LxHotelItem } from "@/lib/lx/types";
import { ScorePill } from "./ui";

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#f2f2f2'/><text x='50%' y='50%' font-size='48' text-anchor='middle' dominant-baseline='middle' fill='#c9c9c9'>🏨</text></svg>`
  );

function brandEmoji(brand?: string): string {
  if (!brand) return "🏨";
  if (brand.includes("亚朵")) return "📖";
  if (brand.includes("全季")) return "🌿";
  if (brand.includes("桔子")) return "🍊";
  return "🏨";
}

export function HotelCard({
  hotel,
  checkIn,
  checkOut,
}: {
  hotel: LxHotelItem;
  checkIn: string;
  checkOut: string;
}) {
  const href = `/hotel/${hotel.hotel_id}?so=${encodeURIComponent(
    hotel.search_offer_id
  )}&ci=${checkIn}&co=${checkOut}&pic=${encodeURIComponent(hotel.main_picture ?? "")}`;

  return (
    <Link href={href} className="block btn-press">
      <article className="bg-canvas rounded-lg overflow-hidden border border-line shadow-card">
        <div className="relative aspect-[16/10] bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hotel.main_picture || FALLBACK_IMG}
            alt={hotel.hotel_name}
            className="w-full h-full object-cover img-fade"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
            }}
          />
          {hotel.brand_name && (
            <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-canvas/95 backdrop-blur text-[11px] font-semibold text-ink">
              <span>{brandEmoji(hotel.brand_name)}</span>
              <span>{hotel.brand_name}</span>
            </div>
          )}
        </div>

        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-ink leading-snug line-clamp-1 tracking-tightish">
              {hotel.hotel_name}
            </h3>
            <ScorePill score={hotel.review_score} />
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-sub line-clamp-1">
            {hotel.star_tag && <span className="text-faint">{hotel.star_tag}</span>}
            {hotel.district && (
              <>
                <span className="text-lineHover">·</span>
                <span>{hotel.district}</span>
              </>
            )}
            {hotel.business_zone && (
              <>
                <span className="text-lineHover">·</span>
                <span className="line-clamp-1">{hotel.business_zone}</span>
              </>
            )}
          </div>

          <div className="mt-2.5 flex items-end justify-between">
            <div className="flex flex-wrap items-center gap-1">
              {hotel.has_wifi && <span className="tag">WiFi</span>}
              {hotel.has_breakfast && <span className="tag">含早</span>}
              {hotel.has_parking && <span className="tag">停车</span>}
              {hotel.has_gymnasium && <span className="tag">健身</span>}
            </div>
            <div className="text-right leading-none">
              <div className="text-[11px] text-faint">起</div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[13px] text-tertiary font-semibold">¥</span>
                <span className="text-[22px] font-semibold text-ink font-mono tracking-tight">
                  {hotel.min_price != null ? Math.round(hotel.min_price) : "--"}
                </span>
                <span className="text-[11px] text-faint">/晚</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
