// SF-symbol-style stroke icons for the navigation. Inline SVG (no icon dep):
// 24px grid, currentColor, rounded caps/joins so they read well at tab-bar size.

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Today — a checklist item ticked off. */
export function TodayIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.25 12 2.5 2.5 5-5.5" />
    </svg>
  );
}

/** Meds — a two-tone capsule. */
export function MedsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor">
      <g transform="rotate(45 12 12)">
        <rect x="4.5" y="8.5" width="15" height="7" rx="3.5" />
        <path d="M12 8.5v7" />
      </g>
    </svg>
  );
}

/** History — a clock. */
export function HistoryIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

/** Settings — adjustment sliders. */
export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} stroke="currentColor">
      <path d="M4 8h8M16 8h4M4 16h4M12 16h8" />
      <circle cx="14" cy="8" r="2.3" />
      <circle cx="9" cy="16" r="2.3" />
    </svg>
  );
}
