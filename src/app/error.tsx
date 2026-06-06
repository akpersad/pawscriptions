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
      <div className="w-full max-w-sm rounded-card bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-lg)" }}>
        <h1 className="font-display text-xl text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {schemaIssue
            ? "Couldn't reach the database. The pawscriptions schema may no longer be exposed in Supabase (Settings → API → Exposed schemas)."
            : "An unexpected error occurred while loading this page."}
        </p>
        <button
          onClick={() => unstable_retry()}
          className="tap mt-5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink hover:bg-accent-hover"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
