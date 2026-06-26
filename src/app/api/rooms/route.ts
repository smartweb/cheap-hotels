import { NextRequest, NextResponse } from "next/server";
import { getHotelRooms } from "@/lib/lx/hotel";
import { LxApiError } from "@/lib/lx/client";
import { LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** 酒店房型/产品详情：使用搜索返回的 search_offer_id */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = LIMITS.search(ip);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "操作太频繁，请稍后再试" }, { status: 429 });
  }

  let body: { search_offer_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体非 JSON" }, { status: 400 });
  }

  if (!body.search_offer_id) {
    return NextResponse.json(
      { ok: false, error: "缺少必要参数：search_offer_id" },
      { status: 400 }
    );
  }

  try {
    const data = await getHotelRooms(body.search_offer_id);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const err = e as LxApiError;
    return NextResponse.json(
      { ok: false, error: err.message, authRelated: err.authRelated },
      { status: 502 }
    );
  }
}
