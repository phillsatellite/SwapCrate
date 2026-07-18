// SwapCrate logo mark: a rounded app-icon badge with two swap arrows.
// Flat gradient fill (no glass/blur), scales cleanly at any size.
export default function Logo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="SwapCrate logo"
    >
      <defs>
        <linearGradient id="swapcrate-badge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3D9BFF" />
          <stop offset="1" stopColor="#0A6CFF" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#swapcrate-badge)" />
      <g
        stroke="#fff"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* top arrow, pointing right */}
        <path d="M13 19 H31" />
        <path d="M27 15 L31 19 L27 23" />
        {/* bottom arrow, pointing left */}
        <path d="M35 29 H17" />
        <path d="M21 25 L17 29 L21 33" />
      </g>
    </svg>
  );
}
