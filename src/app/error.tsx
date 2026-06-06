"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // The most likely production failure is the Supabase `pawscriptions` schema no
  // longer being exposed (PGRST106) — surface a pointed hint for that case.
  const schemaIssue = /PGRST106|schema/i.test(error.message);

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center p-6">
      <div className="glass w-full max-w-sm rounded-3xl border border-white/50 p-8 text-center shadow-[0_8px_30px_rgba(15,23,42,0.18)]">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-500">
          {schemaIssue
            ? "Couldn't reach the database. The pawscriptions schema may no longer be exposed in Supabase (Settings → API → Exposed schemas)."
            : "An unexpected error occurred while loading this page."}
        </p>
        <button
          onClick={() => unstable_retry()}
          className="mt-5 rounded-full bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
