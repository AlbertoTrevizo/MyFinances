type IconProps = { className?: string };

const base = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

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

export function BudgetIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M15.5 4.5a1.7 1.7 0 0 1 2.4 2.4L7.5 17.3l-3.3.8.8-3.3L15.5 4.5Z" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M5 7h14" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M7 7l.8 12a1 1 0 0 0 1 1h6.4a1 1 0 0 0 1-1L17 7" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function NoteIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M6 3.5h9l3 3V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M15 3.5V7h3" />
      <path d="M8 12h8M8 15.5h5" />
    </svg>
  );
}

export function SortIcon({ direction, className }: { direction: "asc" | "desc"; className?: string }) {
  return (
    <svg className={className} {...base}>
      <path d={direction === "asc" ? "M12 20V4m-6 6 6-6 6 6" : "M12 4v16m-6-6 6 6 6-6"} />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" />
      <path d="M10 12h10M16 8l4 4-4 4" />
    </svg>
  );
}
