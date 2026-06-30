"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { loadOrders, removeOrder, saveOrder, type LocalOrder } from "@/lib/orders";
import { prettyDate } from "@/lib/catalog";
import { api } from "@/lib/browserFetch";
import type { LxHotelOrderDetail } from "@/lib/lx/types";
import { EmptyState, ErrorBanner, GhostButton, Sheet } from "@/components/ui";
import { NavBar } from "@/components/NavBar";
import type { LxHotelOrderPayResponse, PayType } from "@/lib/lx/types";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: "待支付", cls: "bg-amber-soft text-amber" },
  confirmed: { label: "已确认", cls: "bg-green-soft text-green" },
  paid: { label: "已支付", cls: "bg-green-soft text-green" },
  finished: { label: "已入住", cls: "bg-green-soft text-green" },
  cancelled: { label: "已取消", cls: "bg-red-soft text-red" },
  rejected: { label: "已拒绝", cls: "bg-red-soft text-red" },
  no_show: { label: "未入住", cls: "bg-surface text-sub" },
  refunded: { label: "已退款", cls: "bg-surface text-sub" },
};

export function OrdersClient() {
  const [orders, setOrders] = useState<LocalOrder[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // 支付方式选择 + 二次拉起
  const [payTarget, setPayTarget] = useState<LocalOrder | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  /**
   * 选定支付方式后调 /api/pay 二次拉起收银台。
   * pay_params 字段名按 pay_type 兼容：微信H5=h5_url，支付宝H5=pay_url/h5_url。
   * 失败时展示错误并提示用本地 checkout_url 兜底。
   */
  const doPay = async (payType: PayType) => {
    if (!payTarget?.order_no || paying) return;
    setPaying(true);
    setPayError(null);
    const r = await api<LxHotelOrderPayResponse>("/api/pay", {
      order_no: payTarget.order_no,
      pay_type: payType,
    });
    setPaying(false);
    if (!r.ok || !r.data?.pay_params) {
      setPayError(r.error ?? "拉起支付失败，可尝试直接打开收银台");
      return;
    }
    const pp = r.data.pay_params;
    const url = pp.h5_url || pp.pay_url || pp.code_url;
    if (url) {
      window.location.href = url;
    } else {
      setPayError("未获取到支付链接，可尝试直接打开收银台");
    }
  };

  const onRemove = (otn: string) => {
    removeOrder(otn);
    setOrders(loadOrders());
  };

  /**
   * 进入订单页时，对「待支付」且有平台单号的订单并发回查上游真实状态。
   * 支付完成后从收银台跳回，本地记录仍是 pending_payment，需以此刷新为 paid/confirmed。
   * 失败静默处理，不影响本地展示。
   */
  const refreshPending = useCallback(async (list: LocalOrder[]) => {
    const pending = list.filter(
      (o) => o.status === "pending_payment" && o.order_no
    );
    if (pending.length === 0) return;

    setRefreshing(true);
    const results = await Promise.allSettled(
      pending.map((o) =>
        api<LxHotelOrderDetail>(`/api/orders/${encodeURIComponent(o.order_no!)}`, undefined, {
          method: "GET",
        })
      )
    );

    let changed = false;
    results.forEach((r, i) => {
      if (r.status !== "fulfilled" || !r.value.ok || !r.value.data) return;
      const d = r.value.data;
      const o = pending[i];
      const next: LocalOrder = { ...o };
      // 上游 status 优先；若仍 pending 但已支付，用 pay_status 兜底
      if (d.status && d.status !== o.status) {
        next.status = d.status;
        changed = true;
      } else if (d.pay_status === "paid" && o.status === "pending_payment") {
        next.status = "paid";
        changed = true;
      }
      if (d.hotel_name && !o.hotel_name) {
        next.hotel_name = d.hotel_name;
        changed = true;
      }
      if (d.total_amount != null && o.total_amount == null) {
        next.total_amount = d.total_amount;
        changed = true;
      }
      if (changed || next !== o) saveOrder(next);
    });

    if (changed) setOrders(loadOrders());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const list = loadOrders();
    setOrders(list);
    refreshPending(list);
  }, [refreshPending]);

  return (
    <main className="pb-safe min-h-screen">
      <header className="sticky top-0 z-20 bg-canvas/90 backdrop-blur-lg border-b border-line pt-safe">
        <div className="px-4 h-14 flex items-center justify-between">
          <h1 className="text-[17px] font-semibold tracking-tightish text-ink">我的订单</h1>
          {orders && orders.length > 0 && (
            <span className="text-[12px] text-faint">
              {refreshing ? "同步状态中…" : `共 ${orders.length} 单`}
            </span>
          )}
        </div>
      </header>

      <section className="px-4 pt-3">
        {orders === null && (
          <div className="py-16 text-center text-[13px] text-faint">加载中…</div>
        )}

        {orders && orders.length === 0 && (
          <EmptyState
            emoji="📋"
            title="还没有订单"
            hint="去挑一家性价比拉满的品牌酒店吧。"
          />
        )}

        {orders && orders.length > 0 && (
          <ul className="space-y-3">
            {orders.map((o) => {
              const st = STATUS_MAP[o.status ?? ""] ?? {
                label: o.status ?? "—",
                cls: "bg-surface text-sub",
              };
              return (
                <li
                  key={o.out_trade_no}
                  className="rounded-lg border border-line bg-canvas p-4 fade-up"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold text-ink truncate">
                        {o.room_name ?? "品牌酒店"}
                      </div>
                      {o.hotel_name && (
                        <div className="text-[12px] text-sub truncate">{o.hotel_name}</div>
                      )}
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-sm text-[11px] font-medium ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>

                  <div className="mt-2 text-[12px] text-sub leading-relaxed">
                    {o.check_in && o.check_out && (
                      <div>
                        {prettyDate(o.check_in)} → {prettyDate(o.check_out)}
                        {o.nights ? ` · ${o.nights}晚` : ""}
                      </div>
                    )}
                    {o.guest_names && o.guest_names.length > 0 && (
                      <div className="mt-0.5">入住人：{o.guest_names.join("、")}</div>
                    )}
                    <div className="mt-0.5 font-mono text-[11px] text-faint">
                      单号 {o.order_no ?? o.out_trade_no}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <div className="flex items-baseline gap-0.5">
                      {o.total_amount != null && (
                        <>
                          <span className="text-[12px] text-tertiary font-semibold">¥</span>
                          <span className="text-[18px] font-semibold text-ink font-mono">
                            {Math.round(o.total_amount).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {o.status === "pending_payment" && o.order_no && (
                        <button
                          onClick={() => {
                            setPayTarget(o);
                            setPayError(null);
                          }}
                          className="btn-press inline-flex items-center justify-center h-9 px-4 rounded-md bg-ink text-canvas text-[13px] font-medium focus-ring"
                        >
                          去支付
                        </button>
                      )}
                      {o.status === "pending_payment" && !o.order_no && o.checkout_url && (
                        <a
                          href={o.checkout_url}
                          className="btn-press inline-flex items-center justify-center h-9 px-4 rounded-md bg-ink text-canvas text-[13px] font-medium focus-ring"
                        >
                          去支付
                        </a>
                      )}
                      <button
                        onClick={() => onRemove(o.out_trade_no)}
                        className="btn-press inline-flex items-center justify-center h-9 px-3 rounded-md border border-line text-[12px] text-sub hover:bg-surface focus-ring"
                      >
                        移除
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {orders && orders.length === 0 && (
          <div className="px-4 mt-4 flex justify-center">
            <Link href="/">
              <GhostButton>去看看酒店</GhostButton>
            </Link>
          </div>
        )}
      </section>

      {/* 支付方式选择 */}
      <Sheet open={!!payTarget} onClose={() => setPayTarget(null)} title="选择支付方式">
        <div className="p-4 space-y-2.5">
          {payError && <ErrorBanner message={payError} />}
          <button
            disabled={paying}
            onClick={() => doPay("wechat_h5")}
            className="btn-press w-full flex items-center gap-3 p-3.5 rounded-md border border-line bg-canvas hover:bg-surface text-left focus-ring disabled:opacity-50"
          >
            <span className="text-[22px]">💚</span>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-ink">微信支付</div>
              <div className="text-[11px] text-faint">H5 收银台</div>
            </div>
            <span className="text-faint">›</span>
          </button>
          <button
            disabled={paying}
            onClick={() => doPay("alipay_h5")}
            className="btn-press w-full flex items-center gap-3 p-3.5 rounded-md border border-line bg-canvas hover:bg-surface text-left focus-ring disabled:opacity-50"
          >
            <span className="text-[22px]">💙</span>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-ink">支付宝</div>
              <div className="text-[11px] text-faint">H5 收银台</div>
            </div>
            <span className="text-faint">›</span>
          </button>

          {paying && (
            <div className="text-center text-[12px] text-faint py-1">正在拉起支付…</div>
          )}

          {/* 兜底：直接打开下单时返回的收银台 */}
          {payTarget?.checkout_url && (
            <a
              href={payTarget.checkout_url}
              className="block text-center text-[12px] text-tertiary underline py-2"
            >
              直接打开收银台 ›
            </a>
          )}
        </div>
      </Sheet>

      <NavBar />
    </main>
  );
}
