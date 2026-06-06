"use client";

import { undoDose } from "@/lib/actions";

export function UndoDose({ logId }: { logId: string }) {
  return (
    <button
      onClick={() => undoDose(logId)}
      className="text-xs text-slate-400 underline hover:text-slate-600"
    >
      undo
    </button>
  );
}
