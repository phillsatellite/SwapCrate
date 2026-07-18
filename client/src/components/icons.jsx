// Minimal line icons drawn to feel at home in an iOS tab bar.
// `filled` swaps to a solid variant for the active tab.

export function HomeIcon({ filled }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MatchesIcon({ filled }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.3C6.9 16.4 3.5 12.9 3.5 9.1 3.5 6.6 5.5 4.7 8 4.7c1.6 0 3 .8 4 2.2 1-1.4 2.4-2.2 4-2.2 2.5 0 4.5 1.9 4.5 4.4 0 3.8-3.4 7.3-8.5 11.2z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AccountIcon({ filled }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <g
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="8" r="4" />
        <path
          d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6"
          strokeLinecap="round"
          fill={filled ? "currentColor" : "none"}
        />
      </g>
    </svg>
  );
}
