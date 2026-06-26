/**
 * 龙虾出行 — 酒店业务封装（服务端，真实接口）
 */
import { callApi } from "./client";
import type {
  LxHotelOrderCreateRequest,
  LxHotelOrderCreateResponse,
  LxHotelOrderPayRequest,
  LxHotelOrderPayResponse,
  LxHotelRoomsResponse,
  LxHotelSearchRequest,
  LxHotelSearchResponse,
} from "./types";

export function searchHotels(req: LxHotelSearchRequest) {
  return callApi<LxHotelSearchResponse>("/open/v1/hotel/search", {
    method: "POST",
    body: req,
  });
}

/** 查询房型：使用搜索返回的 search_offer_id */
export function getHotelRooms(search_offer_id: string) {
  return callApi<LxHotelRoomsResponse>("/open/v1/hotel/rooms", {
    method: "POST",
    body: { search_offer_id },
  });
}

export function createHotelOrder(req: LxHotelOrderCreateRequest) {
  return callApi<LxHotelOrderCreateResponse>("/open/v1/hotel/order/create", {
    method: "POST",
    body: { ...req, pay_mode: req.pay_mode ?? "user_pay" },
  });
}

/** 发起收银台支付（按 order_no + pay_type） */
export function payHotelOrder(req: LxHotelOrderPayRequest) {
  return callApi<LxHotelOrderPayResponse>("/open/v1/hotel/order/pay", {
    method: "POST",
    body: req,
  });
}
