"use client";

import { useState } from "react";

const NAMES = ["Andrew", "Cindy"] as const;
type Mode = (typeof NAMES)[number] | "other" | "";

/**
 * Who gave the dose: Andrew / Cindy / Other. Choosing Other reveals a free-text
 * input. Uncontrolled (reads `initial` once on mount) and reports the resolved
 * name via `onChange` — mount fresh (e.g. inside a conditionally-rendered sheet)
 * to reset it.
 */
export function GiverField({
  initial,
  onChange,
}: {
  initial: string;
  onChange: (value: string) => void;
}) {
  const known = (NAMES as readonly string[]).includes(initial);
  const [mode, setMode] = useState<Mode>(known ? (initial as Mode) : initial ? "other" : "");
  const [otherText, setOtherText] = useState(known ? "" : initial);

  function pick(next: Mode) {
    setMode(next);
    onChange(next === "other" ? otherText.trim() : next === "" ? "" : next);
  }

  return (
    <div className="mb-2">
      <div role="radiogroup" aria-label="Given by" className="grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1">
        {[...NAMES, "other"].map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => pick(m as Mode)}
              className={`tap rounded-full py-1.5 text-[0.8125rem] font-medium capitalize ${
                active ? "bg-surface text-ink shadow-[var(--shadow-sm)]" : "text-muted"
              }`}
            >
              {m === "other" ? "Other" : m}
            </button>
          );
        })}
      </div>
      {mode === "other" && (
        <input
          value={otherText}
          onChange={(e) => {
            setOtherText(e.target.value);
            onChange(e.target.value.trim());
          }}
          placeholder="Who gave it?"
          aria-label="Other name"
          className="input mt-2"
          autoFocus
        />
      )}
    </div>
  );
}
