interface IconProps {
  className?: string;
}

export function PlayingCardsIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 32 32">
      <rect x="5" y="8" width="15" height="20" rx="2.5" />
      <path d="m12.5 15 2.7 3.2-2.7 3.2-2.7-3.2 2.7-3.2Z" />
      <path d="m12 8 2-3.3a2.5 2.5 0 0 1 3.4-.8l8.1 5a2.5 2.5 0 0 1 .8 3.4L20 22.6" />
    </svg>
  );
}

export function ClubIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 32 32">
      <path d="M16 5.2a5 5 0 0 0-3.8 8.2A5.3 5.3 0 1 0 16 22a5.3 5.3 0 1 0 3.8-8.6A5 5 0 0 0 16 5.2Z" />
      <path d="M16 18.5c0 4.2-1.2 6.7-3.6 8.3h7.2c-2.4-1.6-3.6-4.1-3.6-8.3Z" />
    </svg>
  );
}

/** A chimarrão: gourd, rim and bomba. */
export function MateGourdIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 32 32">
      <path d="M7.6 14.4c-1 3.6-.2 6.8 2.2 9.6 1.4 1.7 3 3.1 4.6 4.2 1.6-1.1 3.2-2.5 4.6-4.2 2.4-2.8 3.2-6 2.2-9.6" />
      <path d="M7.6 14.2c0-1.3 2.9-2.3 6.6-2.3s6.6 1 6.6 2.3-2.9 2.4-6.6 2.4-6.6-1.1-6.6-2.4Z" />
      <path d="m18.4 12.4 6.9-7.3M23.6 3.3l3.3 3.4" />
    </svg>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="M4.6 8.2A8.5 8.5 0 1 1 3.5 14" />
      <path d="M3.5 4.5v4.3h4.3M12 7.5V12l3.2 2" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export function FlagIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="M5 21V4M6 5h11l-2 3 2 3H6" />
    </svg>
  );
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v4M8.5 20h7M10 17h4" />
    </svg>
  );
}

export function DiamondIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="m12 4 7 8-7 8-7-8 7-8Z" />
    </svg>
  );
}

export function VolleyballIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="12" />
      {[0, 120, 240].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 16 16)`}>
          <path d="M16 16C20 13 20 8 16 4" />
          <path d="M22 5.6c2.6 5.7 1.3 11.1-2.38 15.56" />
        </g>
      ))}
    </svg>
  );
}
