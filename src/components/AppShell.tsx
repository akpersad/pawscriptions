import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="glass sticky top-0 z-20 border-b border-white/40 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-[17px] font-semibold tracking-tight">{title}</h1>
          {action}
        </div>
      </header>
      {/* Bottom padding clears the floating tab bar (≈64px bar + gap + safe area). */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
