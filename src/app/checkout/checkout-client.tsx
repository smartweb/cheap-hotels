"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/browserFetch";
import { nights, prettyDate } from "@/lib/catalog";
import { saveOrder } from "@/lib/orders";
import type { LxHotelOrderCreateResponse } from "@/lib/lx/types";
import { ErrorBanner, PrimaryButton } from "@/components/ui";

interface GuestRow {
  name: string;
  id_type: string;
  id_number: string;
}

export function CheckoutClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const searchOfferId = sp.get("so") ?? "";
  const checkIn = sp.get("ci") ?? "";
  const checkOut = sp.get("co") ?? "";
  const offerId = sp.get("oid") ?? "";
  const roomName = sp.get("rn") ?? "酒店房型";

  const nightCount = nights(checkIn, checkOut);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [guests, setGuests] = useState<GuestRow[]>([{ name: "", id_type: "ID_CARD", id_number: "" }]);
  const [arrival, setArrival] = useState("18:00");
  const [special, setSpecial] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    contactName.trim() &&
    /^1\d{10}$/.test(contactPhone.trim()) &&
    guests.every((g) => g.name.trim());

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);

    const out_trade_no = `BH_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const r = await api<LxHotelOrderCreateResponse>("/api/orders", {
      out_trade_no,
      offer_id: offerId,
      contact: { name: contactName.trim(), phone: contactPhone.trim() },
      guests: guests.map((g) => ({
        name: g.name.trim(),
        id_type: g.id_type || "ID_CARD",
        id_number: g.id_number.trim() || undefined,
      })),
      arrival_time: arrival,
      special_request: special.trim() || undefined,
    });

    setSubmitting(false);

    if (!r.ok || !r.data) {
      setError(r.error ?? "下单失败，请稍后重试");
      return;
    }

    // 本地留存（便于「我的订单」展示）
    saveOrder({
      out_trade_no,
      order_no: r.data.order_no,
      room_name: roomName,
      check_in: checkIn,
      check_out: checkOut,
      nights: r.data.nights ?? nightCount,
      total_amount: r.data.total_amount,
      status: r.data.status ?? "pending_payment",
      checkout_url: r.data.checkout_url,
      contact_name: contactName.trim(),
      guest_names: guests.map((g) => g.name.trim()),
      created_at: new Date().toISOString(),
    });

    // 跳转龙虾收银台完成支付
    const url = r.data.checkout_url;
    if (url) {
      window.location.href = url;
    } else {
      // 无收银台地址时退回订单页（保留订单记录）
      router.push("/orders");
    }
  };

  return (
    <main className="pb-[110px] min-h-screen">
      <header className="sticky top-0 z-20 bg-canvas/90 backdrop-blur-lg border-b border-line pt-safe">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="返回"
            className="w-8 h-8 flex items-center justify-center rounded-sm text-ink hover:bg-surface focus-ring"
          >
            ‹
          </button>
          <h1 className="text-[17px] font-semibold tracking-tightish text-ink">填写订单</h1>
        </div>
      </header>

      <section className="px-4 pt-4 space-y-3.5">
        {/* 订单概要 */}
        <div className="rounded-lg border border-line bg-canvas p-4">
          <div className="text-[15px] font-semibold text-ink">{roomName}</div>
          <div className="mt-1.5 text-[12px] text-sub">
            {checkIn && checkOut
              ? `${prettyDate(checkIn)} → ${prettyDate(checkOut)} · 共 ${nightCount} 晚`
              : "日期信息缺失"}
          </div>
        </div>

        {/* 联系人 */}
        <div className="rounded-lg border border-line bg-canvas p-4 space-y-3">
          <div className="text-[13px] font-semibold text-ink">联系人</div>
          <Field label="姓名">
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="用于接收确认信息"
              className="checkout-input"
            />
          </Field>
          <Field label="手机号">
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              inputMode="numeric"
              placeholder="11 位手机号"
              className="checkout-input"
            />
          </Field>
        </div>

        {/* 入住人 */}
        <div className="rounded-lg border border-line bg-canvas p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-semibold text-ink">入住人</div>
            <span className="text-[11px] text-faint">每位房客都需登记</span>
          </div>
          {guests.map((g, i) => (
            <div key={i} className="space-y-2.5 rounded-md bg-surface p-3">
              <div className="flex items-center gap-2">
                <input
                  value={g.name}
                  onChange={(e) => {
                    const next = [...guests];
                    next[i] = { ...g, name: e.target.value };
                    setGuests(next);
                  }}
                  placeholder={`入住人 ${i + 1} 姓名`}
                  className="checkout-input flex-1"
                />
                {guests.length > 1 && (
                  <button
                    onClick={() => setGuests(guests.filter((_, idx) => idx !== i))}
                    className="shrink-0 w-9 h-10 rounded-sm border border-line text-faint hover:text-red hover:bg-red-soft focus-ring"
                    aria-label="删除"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="w-16 text-[13px] text-sub shrink-0">证件类型</label>
                <select
                  value={g.id_type}
                  onChange={(e) => {
                    const next = [...guests];
                    next[i] = { ...g, id_type: e.target.value };
                    setGuests(next);
                  }}
                  className="checkout-input flex-1"
                >
                  <option value="ID_CARD">身份证</option>
                  <option value="PASSPORT">护照</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="w-16 text-[13px] text-sub shrink-0">证件号</label>
                <input
                  value={g.id_number}
                  onChange={(e) => {
                    const next = [...guests];
                    next[i] = { ...g, id_number: e.target.value };
                    setGuests(next);
                  }}
                  placeholder="请输入证件号"
                  className="checkout-input flex-1 font-mono"
                />
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              setGuests([...guests, { name: "", id_type: "ID_CARD", id_number: "" }])
            }
            className="btn-press w-full h-10 rounded-md border border-dashed border-lineHover text-[13px] font-medium text-sub hover:bg-surface focus-ring"
          >
            + 添加入住人
          </button>
        </div>

        {/* 偏好 */}
        <div className="rounded-lg border border-line bg-canvas p-4 space-y-3">
          <div className="text-[13px] font-semibold text-ink">入住偏好（选填）</div>
          <Field label="预计到店">
            <input
              type="time"
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              className="checkout-input"
            />
          </Field>
          <Field label="备注">
            <input
              value={special}
              onChange={(e) => setSpecial(e.target.value)}
              placeholder="如：高楼层、安静房间"
              className="checkout-input"
            />
          </Field>
        </div>

        {error && <ErrorBanner message={error} />}

        <p className="text-[11px] text-faint leading-relaxed px-1">
          点击「确认下单」后将创建订单并跳转至龙虾出行收银台完成支付。订单受平台退改政策约束。
        </p>
      </section>

      <style jsx>{`
        :global(.checkout-input) {
          height: 40px;
          padding: 0 12px;
          border-radius: 6px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: #ffffff;
          font-size: 14px;
          color: #171717;
          outline: none;
          width: 100%;
        }
        :global(.checkout-input:focus) {
          border-color: #006bff;
          box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #006bff;
        }
        :global(.checkout-input::placeholder) {
          color: #a8a8a8;
        }
      `}</style>

      {/* 底部支付栏 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-h5 bg-canvas border-t border-line shadow-bar z-30 bar-safe">
        <div className="flex items-center justify-end gap-3 px-4 py-3">
          <PrimaryButton onClick={submit} disabled={!valid || submitting} className="px-8">
            {submitting ? "下单中…" : "确认下单 · 去支付"}
          </PrimaryButton>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-16 text-[13px] text-sub shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
