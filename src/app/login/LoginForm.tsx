"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <input
        type="password"
        name="password"
        autoFocus
        autoComplete="current-password"
        placeholder="Passphrase"
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-teal-600 px-3 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {pending ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
