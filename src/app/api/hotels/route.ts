import { NextRequest, NextResponse } from "next/server";
import { searchHotels } from "@/lib/lx/hotel";
import { LxApiError } from "@/lib/lx/client";
import { LIMITS } from "@/lib/rateLimit";
import { PRICE_TIERS, BRANDS, CITIES } from "@/lib/catalog";
import type { LxHotelSearchRequest, LxHotelItem } from "@/lib/lx/types";

export const dynamic = "force-dynamic";

interface SearchBody {
  city_code?: string;
  brand?: string; // 全季 / 亚朵 / 桔子水晶
  check_in?: string;
  check_out?: string;
  sort_by?: "best" | "price" | "rating" | "star" | "distance";
}

/**
 * 酒店搜索：品牌限定（全季/亚朵/桔子水晶）+ 价格档位自动升级（300→400）
 * - 默认按"价格升序"，便于优先命中低价品牌酒店
 * - 300 档无结果时自动提升到 400 档
 * - 结果按品牌别名做二次过滤，确保只展示指定品牌
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = LIMITS.search(ip);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "搜索太频繁，请稍后再试" }, { status: 429 });
  }

  let body: SearchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体非 JSON" }, { status: 400 });
  }

  const city = CITIES.find((c) => c.code === body.city_code) ?? CITIES[0];
  const brandDef =
    BRANDS.find((b) => b.name === body.brand) ??
    (body.brand ? BRANDS.find((b) => b.aliases.some((a) => a.toLowerCase() === body.brand!.toLowerCase())) : undefined);

  if (!body.check_in || !body.check_out) {
    return NextResponse.json({ ok: false, error: "缺少必要参数：check_in/check_out" }, { status: 400 });
  }
  if (!brandDef) {
    return NextResponse.json(
      { ok: false, error: `请选择品牌（${BRANDS.map((b) => b.name).join("/")})` },
      { status: 400 }
    );
  }

  const sortBy: LxHotelSearchRequest["sort_by"] = body.sort_by ?? "price";

  // 按价格档位顺序尝试：300 → 400，取第一个有真实命中的
  let lastErr: LxApiError | null = null;
  let usedMaxPrice: number = PRICE_TIERS[0];
  let resultHotels: LxHotelItem[] = [];
  let searchId = "";
  let total = 0;

  for (const tier of PRICE_TIERS) {
    usedMaxPrice = tier;
    const reqBody: LxHotelSearchRequest = {
      destination: city.destination,
      check_in: body.check_in!,
      check_out: body.check_out!,
      adult_count: 2,
      room_count: 1,
      scene: "couple",
      sort_by: sortBy,
      filters: {
        hotel_brand: brandDef.name,
        max_price: tier,
        min_review_score: undefined,
      },
      page: 1,
      page_size: 20,
    };

    try {
      const data = await searchHotels(reqBody);
      // 上游已按 hotel_brand 过滤并填充 brand_name；
      // 这里只做轻量兜底：brand_name 非空且明显不属于本品牌时剔除，
      // 其余（含空 brand_name）一律保留，避免误删上游有效结果。
      const filtered = (data.hotels ?? []).filter((h) => {
        const b = (h.brand_name ?? "").trim();
        if (!b) return true; // 上游命中但未回填品牌，保留
        return brandDef.aliases.some((a) => b.includes(a));
      });
      if (filtered.length > 0) {
        resultHotels = filtered;
        searchId = data.search_id ?? "";
        total = filtered.length;
        break; // 命中即停
      }
      // 当前档位无命中，继续尝试下一档
    } catch (e) {
      lastErr = e as LxApiError;
      // 业务错误（参数等）直接返回；网络/鉴权类不继续尝试
      const err = e as LxApiError;
      if (err.authRelated && err.code !== "network") {
        return NextResponse.json(
          { ok: false, error: err.message, authRelated: true },
          { status: 502 }
        );
      }
      // network 类：继续尝试下一档，保留错误
    }
  }

  if (resultHotels.length === 0 && lastErr && !lastErr.authRelated) {
    return NextResponse.json(
      { ok: false, error: lastErr.message, authRelated: lastErr.authRelated },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      search_id: searchId,
      total,
      hotels: resultHotels,
      city: city.name,
      brand: brandDef.name,
      used_max_price: usedMaxPrice,
      tiers_tried: PRICE_TIERS,
    },
  });
}
