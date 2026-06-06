"use client";

import { useState } from "react";
import { undoDose } from "@/lib/actions";

export function UndoDose({ logId }: { logId: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      onClick={async () => {
        setPending(true);
        try {
          await undoDose(logId);
        } finally {
          setPending(false);
        }
      }}
      disabled={pending}
      className="tap shrink-0 rounded-full px-3 py-1.5 text-[0.8125rem] font-medium text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-50"
    >
      {pending ? "…" : "Undo"}
    </button>
  );
}
