import type { SVGProps } from "react";

export function TrainLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MAX SNCF"
      {...props}
    >
      {/* TGV body — streamlined shape */}
      <path
        d="M6 30 C6 28 7 26 9 25 L34 18 C36 17.3 38 17 40 17.5 C42 18 43 19.5 43 21.5 L43 28 C43 30.2 41.2 32 39 32 L9 32 C7.3 32 6 30.7 6 29Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Nose / front aero */}
      <path
        d="M6 30 L2 29.5 C1.5 29.4 1.2 28.8 1.5 28.4 L7 24 C7.8 23.4 8.5 24.5 8 25.2 L6 28Z"
        fill="currentColor"
        opacity="0.7"
      />
      {/* Window strip */}
      <rect x="14" y="22" width="24" height="4" rx="1.5" fill="currentColor" opacity="0.2" />
      {/* Windows */}
      <rect x="16" y="23" width="3" height="2" rx="0.5" fill="currentColor" opacity="0.35" />
      <rect x="21" y="23" width="3" height="2" rx="0.5" fill="currentColor" opacity="0.35" />
      <rect x="26" y="23" width="3" height="2" rx="0.5" fill="currentColor" opacity="0.35" />
      <rect x="31" y="23" width="3" height="2" rx="0.5" fill="currentColor" opacity="0.35" />
      {/* Front light */}
      <circle cx="5" cy="27" r="1.2" fill="currentColor" opacity="0.5" />
      {/* Rails */}
      <line x1="0" y1="34" x2="48" y2="34" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <line x1="0" y1="36" x2="48" y2="36" stroke="currentColor" strokeWidth="1" opacity="0.15" />
      {/* Wheels */}
      <circle cx="14" cy="33" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="24" cy="33" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="36" cy="33" r="2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
