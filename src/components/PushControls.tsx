"use client";

import { useEffect, useState } from "react";
import { BellIcon, CheckIcon } from "./icons";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

type Status = "loading" | "unsupported" | "enabled" | "disabled" | "denied";

export function PushControls() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari only
      window.navigator.standalone === true);

  async function refresh() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setStatus(sub ? "enabled" : "disabled");
  }

  useEffect(() => {
    // Read the device's current push/permission state on mount (an external
    // browser system); the synchronous setState in the unsupported/denied
    // branches is intentional initialization, not a render cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sub.toJSON(),
          label: navigator.userAgent.slice(0, 60),
        }),
      });
      if (!res.ok) throw new Error("Failed to save subscription");
      setStatus("enabled");
      setMsg("Reminders enabled on this device.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not enable reminders.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("disabled");
      setMsg("Reminders turned off on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/push/test", { method: "POST" });
    setMsg(res.ok ? "Test sent — check your notifications." : "Test failed.");
    setBusy(false);
  }

  return (
    <section className="rounded-card bg-surface p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <BellIcon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-ink">Reminders</h2>
          <p className="text-[0.8125rem] text-muted">
            {status === "enabled"
              ? "On for this device"
              : status === "denied"
                ? "Blocked in settings"
                : status === "unsupported"
                  ? "Not available here"
                  : status === "loading"
                    ? "Checking…"
                    : "Off for this device"}
          </p>
        </div>
        {status === "enabled" && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-[0.75rem] font-medium text-success">
            <CheckIcon className="size-3.5" /> On
          </span>
        )}
      </div>

      {status === "unsupported" && !isStandalone && (
        <p className="mt-3 rounded-row bg-warning-soft p-3 text-[0.8125rem] leading-relaxed text-ink">
          On iPhone: tap the Share button, choose <b className="font-semibold">Add to Home Screen</b>,
          then open Pawscriptions from its icon to enable reminders. (Requires iOS 16.4+.)
        </p>
      )}

      {status === "denied" && (
        <p className="mt-3 rounded-row bg-danger-soft p-3 text-[0.8125rem] leading-relaxed text-ink">
          Notifications are blocked. Enable them for this site in your browser or OS settings, then reload.
        </p>
      )}

      {status === "disabled" && (
        <div className="mt-3">
          {!isStandalone && (
            <p className="mb-3 rounded-row bg-warning-soft p-3 text-[0.8125rem] leading-relaxed text-ink">
              For reliable reminders on iPhone, add this app to your Home Screen first and open it from there.
            </p>
          )}
          <button
            onClick={enable}
            disabled={busy}
            className="tap w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-accent-ink hover:bg-accent-hover disabled:opacity-60"
          >
            {busy ? "Enabling…" : "Enable reminders"}
          </button>
        </div>
      )}

      {status === "enabled" && (
        <div className="mt-3 flex gap-2.5">
          <button
            onClick={test}
            disabled={busy}
            className="tap flex-1 rounded-full border border-border bg-surface py-2.5 text-sm font-medium text-ink hover:bg-surface-2 disabled:opacity-60"
          >
            Send test
          </button>
          <button
            onClick={disable}
            disabled={busy}
            className="tap flex-1 rounded-full py-2.5 text-sm font-medium text-muted hover:bg-surface-2 disabled:opacity-60"
          >
            Turn off
          </button>
        </div>
      )}

      {msg && <p className="mt-3 text-[0.8125rem] text-muted">{msg}</p>}
    </section>
  );
}
