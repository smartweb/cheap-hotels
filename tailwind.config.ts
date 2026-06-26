import type { Config } from "tailwindcss";

/**
 * 设计语言：Vercel Geist（Light theme）
 *  - 近中性画布、高对比、克制配色、大量留白
 *  - 灰阶承载信息层级；accent 仅用于状态与唯一主操作
 *  - 4px 间距栅格；6/12/16px 圆角；阴影克制
 * 参考文档：https://vercel.com/design.md
 */
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // —— Geist 语义令牌 ——
        primary: "#171717", // gray-1000 主文本/主按钮
        secondary: "#4d4d4d", // gray-900 次文本
        tertiary: "#006bff", // blue-700 链接/聚焦
        canvas: "#ffffff", // background-100 主表面
        surface: "#fafafa", // background-200 次表面
        line: "rgba(0,0,0,0.10)", // 发丝描边（gray-alpha）
        lineHover: "rgba(0,0,0,0.21)",
        // —— 灰阶（按需精简到 UI 实用档位）——
        ink: "#171717",
        sub: "#7d7d7d", // gray-800
        faint: "#a8a8a8", // gray-600
        // —— accent scale（语义）——
        blue: {
          DEFAULT: "#006bff", // blue-700
          soft: "#f0f7ff", // blue-100
        },
        green: {
          DEFAULT: "#279141", // green-800
          soft: "#e5fce7",
        },
        amber: {
          DEFAULT: "#aa4d00", // amber-900
          soft: "#fff6de",
        },
        red: {
          DEFAULT: "#ea001d", // red-800
          soft: "#ffeeef",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      maxWidth: {
        h5: "480px",
      },
      // Geist elevation（克制阴影）
      boxShadow: {
        card: "0 2px 2px rgba(0,0,0,0.04)",
        pop: "0 1px 1px rgba(0,0,0,0.02), 0 4px 8px -4px rgba(0,0,0,0.04), 0 16px 24px -8px rgba(0,0,0,0.06)",
        modal: "0 1px 1px rgba(0,0,0,0.02), 0 8px 16px -4px rgba(0,0,0,0.04), 0 24px 32px -8px rgba(0,0,0,0.06)",
        bar: "0 -2px 12px -4px rgba(0,0,0,0.06)",
        focus: "0 0 0 2px #ffffff, 0 0 0 4px #006bff",
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "16px",
      },
      letterSpacing: {
        tightish: "-0.01em",
        tight: "-0.02em",
      },
    },
  },
  plugins: [],
};

export default config;
