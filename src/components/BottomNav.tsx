"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HistoryIcon, MedsIcon, SettingsIcon, TodayIcon } from "./icons";

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
      <div
        className="glass pointer-events-auto flex w-full max-w-md items-center gap-1 rounded-[1.75rem] border border-glass-border p-1.5"
        style={{ boxShadow: "var(--shadow-lg), var(--inner-highlight)" }}
      >
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`tap relative flex flex-1 flex-col items-center gap-0.5 rounded-[1.375rem] py-1.5 text-[0.6875rem] font-medium ${
                active ? "text-accent" : "text-muted hover:text-ink"
              }`}
            >
              {/* Selection capsule behind the active tab. */}
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-[1.375rem] bg-accent-soft ring-1 ring-inset ring-accent/15"
                />
              )}
              <Icon className="relative size-[1.4rem]" />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
