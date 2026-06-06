import { ReactNode } from "react";
import Link from "next/link";
import { BottomNav } from "./BottomNav";
import { ArrowLeftIcon } from "./icons";

export function AppShell({
  title,
  subtitle,
  back,
  action,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: { href: string; label?: string };
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="glass sticky top-0 z-20 border-b border-border/70 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex min-h-[3.25rem] max-w-md items-center gap-2.5 px-4 py-2.5">
          {back && (
            <Link
              href={back.href}
              aria-label={back.label ?? "Back"}
              className="tap -ml-1.5 grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            >
              <ArrowLeftIcon className="size-5" />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[1.0625rem] font-semibold leading-tight tracking-[-0.01em]">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-[0.8125rem] leading-tight text-muted">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      </header>
      {/* Bottom padding clears the floating tab bar (≈64px bar + gap + safe area). */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] pt-5">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
