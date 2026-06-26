import { NextResponse } from "next/server";
import { lxConfig } from "@/lib/lx/client";

export const dynamic = "force-dynamic";

/** 健康检查：确认 token 已配置（不暴露 token 本身） */
export async function GET() {
  return NextResponse.json({
    ok: true,
    base: lxConfig.BASE,
    hasToken: lxConfig.hasToken,
    time: new Date().toISOString(),
  });
}
