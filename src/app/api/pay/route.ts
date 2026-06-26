import { NextRequest, NextResponse } from "next/server";
import { payHotelOrder } from "@/lib/lx/hotel";
import { LxApiError } from "@/lib/lx/client";
import { LIMITS } from "@/lib/rateLimit";
import type { PayType } from "@/lib/lx/types";

export const dynamic = "force-dynamic";

interface PayBody {
  order_no?: string;
  pay_type?: PayType;
  openid?: string;
}

/**
 * 发起收银台支付（按 order_no + pay_type）。
 * 注意：订单创建接口在 user_pay 模式下已直接返回 checkout_url，
 * 本路由作为「二次拉起支付」的备用入口（如超时重试、换支付方式）。
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = LIMITS.order(ip);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "操作太频繁，请稍后再试" }, { status: 429 });
  }

  let body: PayBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体非 JSON" }, { status: 400 });
  }

  if (!body.order_no || !body.pay_type) {
    return NextResponse.json(
      { ok: false, error: "缺少必要参数：order_no/pay_type" },
      { status: 400 }
    );
  }

  try {
    const data = await payHotelOrder({
      order_no: body.order_no,
      pay_type: body.pay_type,
      openid: body.openid,
      return_url: `${req.nextUrl.origin}/orders`,
    });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const err = e as LxApiError;
    return NextResponse.json(
      { ok: false, error: err.message, authRelated: err.authRelated },
      { status: 502 }
    );
  }
}
