import { AppShell } from "@/components/AppShell";
import { PushControls } from "@/components/PushControls";
import { PawMark } from "@/components/PawMark";
import { logout } from "./actions";
import { appTimezone } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <div className="flex flex-col gap-5">
        <PushControls />

        <section className="rounded-card bg-surface p-4 shadow-[var(--shadow-sm)]">
          <h2 className="text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-muted">About</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            Dose times are scheduled in <b className="font-semibold">{appTimezone()}</b>.
          </p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
            Reminders are delivered by a scheduled job — make sure the external cron is
            configured (see the project README).
          </p>
        </section>

        <form action={logout}>
          <button className="tap w-full rounded-full border border-border bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-surface-2">
            Log out
          </button>
        </form>

        <div className="mt-2 flex flex-col items-center gap-2 pb-2 text-center">
          <PawMark size={36} className="opacity-90" />
          <p className="font-display text-sm text-muted">Pawscriptions</p>
        </div>
      </div>
    </AppShell>
  );
}
