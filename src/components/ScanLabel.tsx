"use client";

import { useRef, useState } from "react";
import { parseLabel, type ParsedLabel } from "@/lib/parseLabel";

type Status = "idle" | "reading" | "done" | "error";

/**
 * Scan a printed medication label and prefill the form from it. OCR runs
 * entirely in the browser via Tesseract.js (lazy-loaded on first use) — the
 * photo is never uploaded or stored; it lives only in memory for the scan and
 * is discarded immediately after. The user reviews/edits everything before save.
 */
export function ScanLabel({ onParsed }: { onParsed: (parsed: ParsedLabel) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [pct, setPct] = useState(0);
  const [summary, setSummary] = useState<string>("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setStatus("reading");
    setPct(0);
    setSummary("");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setPct(Math.round(m.progress * 100));
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();

      const parsed = parseLabel(data.text);
      onParsed(parsed);

      const found = [
        parsed.name && "name",
        parsed.strength && "strength",
        parsed.dose != null && "dose",
        parsed.times && "schedule",
      ].filter(Boolean) as string[];
      setSummary(
        found.length
          ? `Filled in ${found.join(", ")}. Check everything below before saving.`
          : "Couldn't read much — fill in the fields below.",
      );
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-card border border-dashed border-border-strong p-3.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "reading"}
        className="tap flex w-full items-center justify-center gap-2 rounded-full bg-surface-2 py-2.5 text-sm font-semibold text-ink hover:text-accent disabled:opacity-60"
      >
        <CameraIcon className="size-4" />
        {status === "reading" ? `Reading label… ${pct}%` : "Scan label"}
      </button>
      {status === "done" && <p className="mt-2 px-1 text-[0.8125rem] text-muted">{summary}</p>}
      {status === "error" && (
        <p className="mt-2 px-1 text-[0.8125rem] text-danger">
          Couldn&apos;t read that image. Try again with a clearer, well-lit photo — or just type it in.
        </p>
      )}
      {status === "idle" && (
        <p className="mt-2 px-1 text-[0.75rem] text-faint">
          Photo is read on your device only — nothing is uploaded or saved.
        </p>
      )}
    </div>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
