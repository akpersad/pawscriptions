"use client";

import { useEffect, useState } from "react";

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
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <h2 className="font-medium">Reminders on this device</h2>

      {status === "unsupported" && (
        <div className="mt-2 text-sm text-slate-500">
          <p>This browser can&apos;t receive push notifications.</p>
          {!isStandalone && (
            <p className="mt-2 rounded-lg bg-amber-50 p-2 text-amber-800">
              On iPhone: tap the Share button → <b>Add to Home Screen</b>, then open
              Pawscriptions from the home-screen icon to enable reminders. (Requires iOS 16.4+.)
            </p>
          )}
        </div>
      )}

      {status === "denied" && (
        <p className="mt-2 text-sm text-red-600">
          Notifications are blocked. Enable them for this site in your browser/OS settings,
          then reload.
        </p>
      )}

      {status === "disabled" && (
        <div className="mt-2">
          {!isStandalone && (
            <p className="mb-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
              For reliable reminders on iPhone, first add this app to your Home Screen and
              open it from there.
            </p>
          )}
          <button
            onClick={enable}
            disabled={busy}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Enabling…" : "Enable reminders"}
          </button>
        </div>
      )}

      {status === "enabled" && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-700">
            ✓ Enabled
          </span>
          <button onClick={test} disabled={busy} className="text-sm text-slate-600 underline">
            Send test
          </button>
          <button onClick={disable} disabled={busy} className="text-sm text-slate-500 underline">
            Turn off
          </button>
        </div>
      )}

      {status === "loading" && <p className="mt-2 text-sm text-slate-400">Checking…</p>}
      {msg && <p className="mt-2 text-sm text-slate-500">{msg}</p>}
    </div>
  );
}
