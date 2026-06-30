/**
 * 龙虾出行开放平台 — 类型定义（与真实接口字段对齐）
 * 文档：https://docs.longxiachuxing.com
 *
 * 字段命名严格按线上接口（Go struct → snake_case）。
 * 酒店：destination(关键字)/check_in/check_out/scene/sort_by/filters
 * 房型：search_offer_id → room_types[].products[].offer_id
 * 下单：offer_id + out_trade_no + contact + pay_mode:user_pay → 返回 checkout_url
 */

/** 平台统一响应外壳：code === 0 表示成功 */
export interface LxEnvelope<T> {
  code: number;
  message?: string;
  request_id?: string;
  data?: T;
}

/* ------------------------------------------------------------------ */
/* 酒店 搜索                                                            */
/* ------------------------------------------------------------------ */
export type HotelScene = "couple" | "family" | "senior" | "business" | "inbound";
export type HotelSortBy = "best" | "price" | "rating" | "star" | "distance";

export interface LxHotelSearchFilters {
  min_price?: number;
  max_price?: number;
  min_review_score?: number;
  star_levels?: number[];
  has_child_facility?: boolean;
  has_swimming_pool?: boolean;
  has_breakfast?: boolean;
  has_wifi?: boolean;
  has_parking?: boolean;
  has_gymnasium?: boolean;
  has_restaurant?: boolean;
  hotel_brand?: string;
  max_distance_km?: number;
}

export interface LxHotelSearchRequest {
  destination: string; // 目的地关键字（如 "深圳"）
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  adult_count?: number;
  room_count?: number;
  scene?: HotelScene;
  sort_by?: HotelSortBy;
  filters?: LxHotelSearchFilters;
  page?: number;
  page_size?: number;
  latitude?: number;
  longitude?: number;
  adcode?: string;
}

export interface LxHotelItem {
  hotel_id: string;
  hotel_name: string;
  hotel_name_en?: string;
  city?: string;
  district?: string;
  business_zone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  star_rating?: number;
  star_tag?: string; // 经济型/舒适型/高档型/豪华型
  review_score?: number;
  review_count?: number;
  main_picture?: string;
  brand_name?: string;
  has_wifi?: boolean;
  has_parking?: boolean;
  has_swimming_pool?: boolean;
  has_breakfast?: boolean;
  has_child_facility?: boolean;
  has_gymnasium?: boolean;
  has_restaurant?: boolean;
  scene_tags?: string[];
  min_price?: number;
  currency?: string;
  /** 搜索阶段令牌，用于查询房型 */
  search_offer_id: string;
}

export interface LxPageInfo {
  page: number;
  page_size: number;
  total: number;
}

export interface LxHotelSearchResponse {
  search_id: string;
  total: number;
  page_info?: LxPageInfo;
  hotels: LxHotelItem[];
}

/* ------------------------------------------------------------------ */
/* 酒店 详情                                                            */
/* ------------------------------------------------------------------ */
/**
 * 龙虾 — 酒店详情
 * 路径：GET /open/v1/hotel/{hotel_id}
 * 字段比搜索结果更全（含 address / 完整设施等），用于详情页信息卡。
 */
export interface LxHotelDetail {
  hotel_id: string;
  hotel_name: string;
  hotel_name_en?: string;
  brand_name?: string;
  city?: string;
  district?: string;
  business_zone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  star_rating?: number;
  star_tag?: string;
  review_score?: number;
  review_count?: number;
  main_picture?: string;
  has_wifi?: boolean;
  has_parking?: boolean;
  has_swimming_pool?: boolean;
  has_breakfast?: boolean;
  has_child_facility?: boolean;
  has_gymnasium?: boolean;
  has_restaurant?: boolean;
  min_price?: number;
  currency?: string;
}

/* ------------------------------------------------------------------ */
/* 酒店 房型/产品                                                       */
/* ------------------------------------------------------------------ */
export interface LxRoomType {
  room_type_id: string;
  room_name: string;
  bed_type?: string; // big_bed / twin / multi
  area?: number; // 平米
  max_occupancy?: number;
  has_window?: boolean;
  facilities?: string[];
  /** 产品列表（不同取消政策/早餐） */
  products: LxRoomProduct[];
}

export interface LxRoomProduct {
  offer_id: string;
  product_id?: string;
  product_name?: string;
  price: number; // 价格（元/晚）
  currency?: string;
  has_breakfast?: boolean;
  refundable?: boolean;
  cancel_policy?: string;
}

export interface LxHotelRoomsResponse {
  hotel_id: string;
  hotel_name?: string;
  check_in?: string;
  check_out?: string;
  room_types: LxRoomType[];
}

/* ------------------------------------------------------------------ */
/* 联系人 / 入住人                                                      */
/* ------------------------------------------------------------------ */
export type IdType = "ID_CARD" | "PASSPORT";

export interface LxContactInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface LxGuestInfo {
  name: string;
  name_en?: string;
  id_type?: IdType;
  id_number?: string;
}

/* ------------------------------------------------------------------ */
/* 酒店订单                                                              */
/* ------------------------------------------------------------------ */
export type PayMode = "user_pay" | "enterprise_credit" | "monthly_settle";

export interface LxHotelOrderCreateRequest {
  out_trade_no: string; // 商户订单号（幂等键，必填）
  offer_id: string; // 来自 room_types[].products[].offer_id
  contact: LxContactInfo;
  guests: LxGuestInfo[];
  pay_mode: PayMode;
  return_url?: string; // 支付成功跳转
  callback_url?: string;
  arrival_time?: string; // HH:MM
  special_request?: string;
  external_user_id?: string;
  external_user_name?: string;
  need_invoice?: boolean;
}

export interface LxHotelOrderCreateResponse {
  order_no?: string; // 平台订单号 RCA...
  out_trade_no?: string;
  status?: string; // pending_payment
  total_amount?: number;
  currency?: string;
  hotel_name?: string;
  room_name?: string;
  room_count?: number;
  nights?: number;
  check_in?: string;
  check_out?: string;
  created_at?: string;
  expires_at?: string;
  pay_mode?: string;
  /** 托管收银台地址（pay_mode=user_pay 时返回） */
  checkout_url?: string;
  external_user_id?: string;
}

/* ------------------------------------------------------------------ */
/* 酒店订单 支付                                                         */
/* ------------------------------------------------------------------ */
export type PayType =
  | "wechat_h5"
  | "wechat_jsapi"
  | "wechat_native"
  | "wechat_app"
  | "wechat_mini"
  | "alipay_app"
  | "alipay_h5";

export interface LxHotelOrderPayRequest {
  order_no: string;
  pay_type: PayType;
  openid?: string; // wechat_jsapi/mini 必填
  return_url?: string; // alipay_h5 同步跳转
}

export interface LxHotelOrderPayResponse {
  pay_type?: string;
  /** 支付参数（按 pay_type 不同返回不同字段，如 h5_url / code_url / prepay 等） */
  pay_params?: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/* 酒店 订单详情（状态回查）                                            */
/* ------------------------------------------------------------------ */
export type LxOrderStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "rejected"
  | "finished"
  | "no_show";

/** 订单支付状态：unpaid/paid/refunded */
export type LxPayStatus = "unpaid" | "paid" | "refunded";

/**
 * 龙虾 — 酒店订单详情
 * 路径：GET /open/v1/hotel/order/detail/{order_no}
 * 用于「我的订单」支付后回查真实状态、确认号、酒店名等。
 */
export interface LxHotelOrderDetail {
  order_no?: string;
  out_trade_no?: string;
  status?: LxOrderStatus | string;
  pay_status?: LxPayStatus | string;
  confirmation_no?: string;
  hotel_name?: string;
  hotel_address?: string;
  room_name?: string;
  total_amount?: number;
  currency?: string;
  check_in?: string;
  check_out?: string;
  paid_at?: string;
  cancelled_at?: string;
  expires_at?: string;
}
