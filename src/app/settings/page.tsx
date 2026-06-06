import { AppShell } from "@/components/AppShell";
import { PushControls } from "@/components/PushControls";
import { logout } from "./actions";
import { appTimezone } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <div className="flex flex-col gap-4">
        <PushControls />

        <div className="rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-100">
          <h2 className="font-medium">About</h2>
          <p className="mt-1 text-slate-500">
            Dose times are scheduled in <b>{appTimezone()}</b>. Reminders are sent by a
            scheduled job; make sure the external cron is configured (see project README).
          </p>
        </div>

        <form action={logout}>
          <button className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            Log out
          </button>
        </form>
      </div>
    </AppShell>
  );
}
