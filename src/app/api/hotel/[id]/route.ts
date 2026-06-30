import { NextRequest, NextResponse } from "next/server";
import { getHotelDetail } from "@/lib/lx/hotel";
import { LxApiError } from "@/lib/lx/client";
import { LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * 查询酒店详情（地址 / 设施 / 星级 / 评分等）
 * 入参：路径参数 id = 酒店 hotel_id（H...）
 * 出参：酒店基础信息，用于详情页信息卡。
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = LIMITS.search(ip);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "查询太频繁，请稍后再试" }, { status: 429 });
  }

  const hotelId = params.id?.trim();
  if (!hotelId) {
    return NextResponse.json({ ok: false, error: "缺少酒店 id" }, { status: 400 });
  }

  try {
    const data = await getHotelDetail(hotelId);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const err = e as LxApiError;
    return NextResponse.json(
      { ok: false, error: err.message, authRelated: err.authRelated },
      { status: 502 }
    );
  }
}
