"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HistoryIcon,
  MedsIcon,
  SettingsIcon,
  TodayIcon,
} from "./icons";

const ITEMS = [
  { href: "/", label: "Today", Icon: TodayIcon },
  { href: "/medications", label: "Meds", Icon: MedsIcon },
  { href: "/history", label: "History", Icon: HistoryIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    // Full-width wrapper is click-through; only the floating bar catches taps,
    // so the gutters beside it still scroll/tap the content underneath.
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="glass pointer-events-auto flex w-full max-w-md items-center gap-1 rounded-[28px] border border-white/50 p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.7)]">
        {ITEMS.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-[22px] py-1.5 text-[11px] font-medium transition-colors duration-200 ${
                active ? "text-teal-700" : "text-slate-500"
              }`}
            >
              {/* Liquid Glass selection capsule behind the active tab. */}
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-[22px] bg-teal-500/12 ring-1 ring-inset ring-teal-600/15"
                />
              )}
              <Icon className="relative h-6 w-6" />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
