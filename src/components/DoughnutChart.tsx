type Slice = { label: string; value: number; color: string };

export function DoughnutChart({
  data,
  total,
  centerValue,
  centerLabel,
  emptyMessage,
}: {
  data: Slice[];
  total: number;
  centerValue: string;
  centerLabel: string;
  emptyMessage: string;
}) {
  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = data.reduce<{ slice: Slice; dash: number; offset: number }[]>((acc, slice) => {
    const cursor = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
    const fraction = total > 0 ? slice.value / total : 0;
    const dash = fraction * circumference;
    return [...acc, { slice, dash, offset: cursor }];
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--line)"
            strokeWidth={strokeWidth}
          />
          {segments.map(({ slice, dash, offset }) => (
            <circle
              key={slice.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
          <span className="font-mono text-base font-semibold tabular-nums text-ink">{centerValue}</span>
          <span className="text-xs text-ink-muted capitalize">{centerLabel}</span>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-sm text-ink-muted">{emptyMessage}</p>
      ) : (
        <ul className="flex w-full min-w-0 flex-col gap-2 sm:max-w-[180px]">
          {data.map((slice) => (
            <li key={slice.label} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate text-ink-muted">{slice.label}</span>
              </span>
              <span className="shrink-0 font-mono text-xs font-medium tabular-nums text-ink-faint">
                {Math.round((slice.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
