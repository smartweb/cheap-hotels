/**
 * 业务常量：城市、品牌、价格档位、日期工具
 */

export interface CityDef {
  code: string;
  name: string; // 深圳
  short: string; // 深（用于快捷键/简称）
  /** 搜索接口 destination 关键字（品牌酒店在一线城市多用城市名即可命中） */
  destination: string;
}

/** 只做北上广深 */
export const CITIES: CityDef[] = [
  { code: "shenzhen", name: "深圳", short: "深", destination: "深圳" },
  { code: "beijing", name: "北京", short: "京", destination: "北京" },
  { code: "guangzhou", name: "广州", short: "穗", destination: "广州" },
  { code: "shanghai", name: "上海", short: "沪", destination: "上海" },
];

export const DEFAULT_CITY_CODE = "shenzhen";

/** 品牌酒店仅包含以下三个 */
export interface BrandDef {
  name: string; // 全季
  /** 别名/匹配关键字（用于过滤可能不规范的 brand_name 返回） */
  aliases: string[];
  emoji: string;
  tagline: string; // 年轻化文案
}

export const BRANDS: BrandDef[] = [
  { name: "全季", aliases: ["全季", "JI"], emoji: "🌿", tagline: "东方·适度·好眠" },
  { name: "亚朵", aliases: ["亚朵", "Atour"], emoji: "📖", tagline: "人文·温暖·阅读" },
  { name: "桔子水晶", aliases: ["桔子水晶", "Crystal Orange", "桔子"], emoji: "🍊", tagline: "设计·水晶·轻奢" },
];

export const DEFAULT_BRAND = "全季";

/**
 * 价格档位（元/晚）：
 *  - 默认 300 以内
 *  - 300 以内没有，提升到 400
 * 调用方按顺序尝试 [300, 400]，取第一个有结果的档位。
 */
export const PRICE_TIERS = [300, 400] as const;

/* ------------------------------------------------------------------ */
/* 日期工具（无依赖，本地时区）                                          */
/* ------------------------------------------------------------------ */

export function toDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 今天 */
export function today(): string {
  return toDate(new Date());
}

/** 相对今天偏移 n 天 */
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  base.setDate(base.getDate() + n);
  return toDate(base);
}

/** 友好显示：今天 / 明天 / 后天 / 周X · M月D日 */
export function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today0.getTime()) / 86400000);
  const week = ["日", "一", "二", "三", "四", "五", "六"][target.getDay()];
  let prefix = "";
  if (diff === 0) prefix = "今天";
  else if (diff === 1) prefix = "明天";
  else if (diff === 2) prefix = "后天";
  else prefix = `周${week}`;
  return `${prefix} · ${m}月${d}日`;
}

/** 两个日期间的晚数 */
export function nights(checkIn: string, checkOut: string): number {
  const [yi, mi, di] = checkIn.split("-").map(Number);
  const [yo, mo, do_] = checkOut.split("-").map(Number);
  const a = new Date(yi, mi - 1, di);
  const b = new Date(yo, mo - 1, do_);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

/** 是否今天可入住（防止选到过去） */
export function isPast(iso: string): boolean {
  return iso < today();
}
