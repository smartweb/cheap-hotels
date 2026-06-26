/**
 * 本地订单记录（客户端 localStorage）
 * 用于在收银台跳转后找回订单，展示「我的订单」列表。
 * 仅记录我们这侧生成的 out_trade_no 与创建时回执，不存储任何敏感证件全量信息。
 */

export interface LocalOrder {
  out_trade_no: string; // 我方商户单号（幂等键）
  order_no?: string; // 平台单号 RCA...
  hotel_name?: string;
  room_name?: string;
  brand?: string;
  city?: string;
  check_in?: string;
  check_out?: string;
  nights?: number;
  total_amount?: number;
  status?: string; // pending_payment / paid / cancelled ...
  checkout_url?: string;
  contact_name?: string;
  guest_names?: string[];
  created_at: string; // 本地记录时间
}

const KEY = "bh_orders_v1";

export function loadOrders(): LocalOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as LocalOrder[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: LocalOrder) {
  if (typeof window === "undefined") return;
  const list = loadOrders();
  const idx = list.findIndex((o) => o.out_trade_no === order.out_trade_no);
  if (idx >= 0) list[idx] = { ...list[idx], ...order };
  else list.unshift(order);
  // 按 created_at 倒序
  list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
}

export function removeOrder(out_trade_no: string) {
  if (typeof window === "undefined") return;
  const list = loadOrders().filter((o) => o.out_trade_no !== out_trade_no);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function findOrder(out_trade_no: string): LocalOrder | undefined {
  return loadOrders().find((o) => o.out_trade_no === out_trade_no);
}
