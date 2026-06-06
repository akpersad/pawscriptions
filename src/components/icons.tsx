// SF-symbol-style stroke icons. Inline SVG (no icon dependency): a 24px grid,
// currentColor, one consistent 1.75 stroke weight, rounded caps/joins so they
// read cleanly from tab-bar size up to empty-state size.

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  stroke: "currentColor",
  "aria-hidden": true,
};

/** Today — a sun over the horizon: the day at a glance. */
export function TodayIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="11" r="3.4" />
      <path d="M12 4.2V5.6M18.5 11h-1.4M6.9 11H5.5M16.6 6.4l-1 1M8.4 6.4l1 1M4 17h16M7 20h10" />
    </svg>
  );
}

/** Meds — a two-tone capsule. */
export function MedsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
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
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

/** Settings — adjustment sliders. */
export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 8h8M16 8h4M4 16h4M12 16h8" />
      <circle cx="14" cy="8" r="2.3" />
      <circle cx="9" cy="16" r="2.3" />
    </svg>
  );
}

/** Paw — outline mark for empty states and accents. */
export function PawIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <ellipse cx="7.2" cy="9.6" rx="2" ry="2.6" transform="rotate(-20 7.2 9.6)" />
      <ellipse cx="10.4" cy="7.2" rx="2.1" ry="2.8" transform="rotate(-7 10.4 7.2)" />
      <ellipse cx="13.6" cy="7.2" rx="2.1" ry="2.8" transform="rotate(7 13.6 7.2)" />
      <ellipse cx="16.8" cy="9.6" rx="2" ry="2.6" transform="rotate(20 16.8 9.6)" />
      <path d="M12 12.4c-2.7 0-4.8 1.9-4.8 4.1 0 1.7 1.5 2.6 3 2.6 1 0 1.3-.4 1.8-.4s.8.4 1.8.4c1.5 0 3-.9 3-2.6 0-2.2-2.1-4.1-4.8-4.1Z" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M18 16V11a6 6 0 1 0-12 0v5l-1.6 2.4h15.2L18 16Z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7" />
    </svg>
  );
}
