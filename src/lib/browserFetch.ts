"use client";

/**
 * 统一的 BFF 调用封装：解析 { ok, data | error } 外壳。
 */
export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  authRelated?: boolean;
}

export async function api<T>(
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      ...init,
    });
    const json = (await res.json()) as ApiResult<T>;
    return json;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `网络请求失败：${msg}` };
  }
}
