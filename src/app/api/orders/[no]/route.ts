import { NextRequest, NextResponse } from "next/server";
import { getHotelOrderDetail } from "@/lib/lx/hotel";
import { LxApiError } from "@/lib/lx/client";
import { LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * 查询订单详情（状态回查）
 * 入参：路径参数 no = 平台订单号 order_no（RCA...）
 * 出参：上游订单详情，含真实 status / pay_status / confirmation_no / hotel_name 等
 *
 * 用于「我的订单」支付后回查真实状态，避免本地记录永远停在 pending_payment。
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { no: string } }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = LIMITS.order(ip);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "查询太频繁，请稍后再试" }, { status: 429 });
  }

  const orderNo = params.no?.trim();
  if (!orderNo) {
    return NextResponse.json({ ok: false, error: "缺少订单号" }, { status: 400 });
  }

  try {
    const data = await getHotelOrderDetail(orderNo);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const err = e as LxApiError;
    return NextResponse.json(
      { ok: false, error: err.message, authRelated: err.authRelated },
      { status: 502 }
    );
  }
}
