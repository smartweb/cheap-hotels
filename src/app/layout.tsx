import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "特价品牌酒店 · 全国热门城市",
  description: "全季 / 亚朵 / 桔子水晶 / 丽枫 / 希尔顿欢朋 / 欢阁，300 元内的品质之选。今天就走。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#fafafa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <div className="h5-shell">{children}</div>
      </body>
    </html>
  );
}
