"use client";

import { useEffect } from "react";

/* ------------------------------------------------------------------ */
/* 底部弹层（ActionSheet 风格，避免原生 select）                        */
/* ------------------------------------------------------------------ */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-h5 bg-canvas rounded-t-lg fade-up bar-safe shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 h-14 border-b border-line">
            <div className="text-[17px] font-semibold tracking-tightish text-ink">{title}</div>
            <button
              onClick={onClose}
              aria-label="关闭"
              className="w-8 h-8 flex items-center justify-center rounded-sm text-sub hover:bg-surface focus-ring"
            >
              ✕
            </button>
          </div>
        )}
        <div className="max-h-[68vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 加载 / 骨架 / 空态 / 错误                                            */
/* ------------------------------------------------------------------ */
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-sub">
      <div className="w-7 h-7 border-2 border-line border-t-tertiary rounded-full animate-spin" />
      {label && <div className="text-[13px]">{label}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function EmptyState({
  emoji = "🏨",
  title,
  hint,
}: {
  emoji?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-6">
      <div className="text-4xl mb-1 opacity-80">{emoji}</div>
      <div className="font-semibold text-ink text-[17px]">{title}</div>
      {hint && <div className="text-[13px] text-sub leading-relaxed">{hint}</div>}
    </div>
  );
}

/** 错误提示横幅（IP 白名单等鉴权问题） */
export function ErrorBanner({
  message,
  authRelated,
}: {
  message: string;
  authRelated?: boolean;
}) {
  return (
    <div className="mx-4 my-3 rounded-md p-3.5 bg-red-soft border border-line text-ink text-[13px]">
      <div className="font-semibold text-red mb-0.5">
        ⚠️ {authRelated ? "接口不可用" : "出错了"}
      </div>
      <div className="text-[13px] leading-relaxed text-sub">
        {message}
        {authRelated &&
          "（请在龙虾平台后台将服务端出口 IP 加入白名单，并确认 LX_API_TOKEN 已配置。）"}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 主按钮 / 次按钮 / 标签                                               */
/* ------------------------------------------------------------------ */
export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`btn-press inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-ink text-canvas text-[15px] font-medium disabled:opacity-40 disabled:cursor-not-allowed focus-ring ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`btn-press inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-canvas border border-line text-ink text-[15px] font-medium hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed focus-ring ${className}`}
    >
      {children}
    </button>
  );
}

/** 评分小胶囊（亚朵/全季式评分展示） */
export function ScorePill({ score }: { score?: number }) {
  if (!score) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber">
      <span>★</span>
      <span className="font-mono">{score.toFixed(1)}</span>
    </span>
  );
}
