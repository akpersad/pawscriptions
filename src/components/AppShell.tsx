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
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">{title}</h1>
          {action}
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
