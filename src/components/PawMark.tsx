import { useId } from "react";

/**
 * Pawscriptions brand mark — a tri-color mini-Aussie paw on a warm copper tile.
 * The geometry here is the single source of truth for the logo; the PWA/favicon
 * rasters in `scripts/generate-icons.mjs` reproduce the same layout.
 *
 * `variant="badge"` (default) draws the copper tile + cream paw (the app logo).
 * `variant="bare"` draws just the paw in the current accent color, for placing
 * on an existing surface.
 */
export function PawMark({
  size = 56,
  variant = "badge",
  className,
}: {
  size?: number;
  variant?: "badge" | "bare";
  className?: string;
}) {
  const id = useId();
  const tile = `tile-${id}`;
  const glint = `glint-${id}`;

  // Toe pads: four rotated ellipses arcing above a rounded metacarpal pad.
  const toes = [
    { cx: 30, cy: 40, rx: 8.5, ry: 11, rot: -20 },
    { cx: 43.5, cy: 30, rx: 9, ry: 12, rot: -7 },
    { cx: 56.5, cy: 30, rx: 9, ry: 12, rot: 7 },
    { cx: 70, cy: 40, rx: 8.5, ry: 11, rot: 20 },
  ];

  const pawFill = variant === "badge" ? "#FAF2E6" : "var(--accent)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Pawscriptions"
      className={className}
    >
      {variant === "badge" && (
        <defs>
          <linearGradient id={tile} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#C77F4A" />
            <stop offset="1" stopColor="#7C4326" />
          </linearGradient>
          <radialGradient id={glint} cx="0.3" cy="0.24" r="0.7">
            <stop offset="0" stopColor="#F0C794" stopOpacity="0.55" />
            <stop offset="0.55" stopColor="#F0C794" stopOpacity="0" />
          </radialGradient>
        </defs>
      )}

      {variant === "badge" && (
        <>
          <rect x="0" y="0" width="100" height="100" rx="24" fill={`url(#${tile})`} />
          <rect x="0" y="0" width="100" height="100" rx="24" fill={`url(#${glint})`} />
        </>
      )}

      <g fill={pawFill}>
        {toes.map((t, i) => (
          <ellipse
            key={i}
            cx={t.cx}
            cy={t.cy}
            rx={t.rx}
            ry={t.ry}
            transform={`rotate(${t.rot} ${t.cx} ${t.cy})`}
          />
        ))}
        <ellipse cx="50" cy="62" rx="20" ry="16.5" />
      </g>
    </svg>
  );
}
