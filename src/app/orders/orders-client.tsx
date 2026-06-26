"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadOrders, removeOrder, type LocalOrder } from "@/lib/orders";
import { prettyDate } from "@/lib/catalog";
import { EmptyState, GhostButton } from "@/components/ui";
import { NavBar } from "@/components/NavBar";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: "待支付", cls: "bg-amber-soft text-amber" },
  paid: { label: "已支付", cls: "bg-green-soft text-green" },
  confirmed: { label: "已确认", cls: "bg-green-soft text-green" },
  cancelled: { label: "已取消", cls: "bg-red-soft text-red" },
};

export function OrdersClient() {
  const [orders, setOrders] = useState<LocalOrder[] | null>(null);

  useEffect(() => {
    setOrders(loadOrders());
  }, []);

  const onRemove = (otn: string) => {
    removeOrder(otn);
    setOrders(loadOrders());
  };

  return (
    <main className="pb-safe min-h-screen">
      <header className="sticky top-0 z-20 bg-canvas/90 backdrop-blur-lg border-b border-line pt-safe">
        <div className="px-4 h-14 flex items-center justify-between">
          <h1 className="text-[17px] font-semibold tracking-tightish text-ink">我的订单</h1>
          {orders && orders.length > 0 && (
            <span className="text-[12px] text-faint">共 {orders.length} 单</span>
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
                            {o.total_amount.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {o.status === "pending_payment" && o.checkout_url && (
                        <a href={o.checkout_url} className="btn-press inline-flex items-center justify-center h-9 px-4 rounded-md bg-ink text-canvas text-[13px] font-medium focus-ring">
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

      <NavBar />
    </main>
  );
}
