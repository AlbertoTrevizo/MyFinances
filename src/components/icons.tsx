type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function ExpensesIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M6 3h12v17l-2.5-1.6L13 20l-2.5-1.6L8 20l-2-1.6V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

export function AccountsIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M16 14.5h2" />
    </svg>
  );
}

export function CategoriesIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M4 4h7l9 9-7 7-9-9V4Z" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SortIcon({ direction, className }: { direction?: "asc" | "desc"; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} fill="currentColor">
      <path d="M6 2.5 8.7 6H3.3L6 2.5Z" opacity={direction === "asc" ? 1 : 0.35} />
      <path d="M6 9.5 3.3 6h5.4L6 9.5Z" opacity={direction === "desc" ? 1 : 0.35} />
    </svg>
  );
}
