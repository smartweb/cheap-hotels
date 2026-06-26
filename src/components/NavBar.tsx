"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "找房", icon: "🏨" },
  { href: "/orders", label: "订单", icon: "📋" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-h5 bg-canvas/90 backdrop-blur-lg border-t border-line z-30 bar-safe shadow-bar">
      <div className="flex items-stretch justify-around">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 btn-press"
            >
              <span className={`text-[20px] leading-none ${active ? "" : "opacity-50 grayscale"}`}>
                {t.icon}
              </span>
              <span
                className={`text-[11px] font-medium ${active ? "text-ink" : "text-faint"}`}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
