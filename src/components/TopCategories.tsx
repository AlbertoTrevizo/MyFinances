type Item = { label: string; value: number; color: string };

export function TopCategories({
  items,
  maxValue,
  emptyMessage,
  formatValue,
}: {
  items: Item[];
  maxValue: number;
  emptyMessage: string;
  formatValue: (value: number) => string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">{emptyMessage}</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={item.label} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-ink">
              <span className="font-mono text-xs text-ink-faint">{index + 1}</span>
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 font-mono font-semibold tabular-nums text-ink">
              {formatValue(item.value)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full"
              style={{
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
