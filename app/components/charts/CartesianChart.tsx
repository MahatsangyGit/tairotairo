"use client";

import { useId, useMemo, useState, type MouseEvent } from "react";
import type { LiveChartsSeries } from "@/lib/charts/livecharts-model";
import { liveChartsMax } from "@/lib/charts/livecharts-model";

type Props = {
  title: string;
  labels: string[];
  series: LiveChartsSeries[];
  yFormatter?: (n: number) => string;
  height?: number;
};

function formatDayLabel(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  }
  return iso.length > 18 ? `${iso.slice(0, 16)}…` : iso;
}

export default function CartesianChart({
  title,
  labels,
  series,
  yFormatter = (n) => String(n),
  height = 280,
}: Props) {
  const gid = useId();
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [hover, setHover] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);

  const visible = series.filter((s) => !hidden[s.name]);
  const pad = { top: 16, right: 12, bottom: 36, left: 44 };
  const width = 640;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxY = Math.max(1, liveChartsMax(visible));
  const n = Math.max(labels.length, 1);

  const xAt = (i: number) =>
    pad.left + (n === 1 ? innerW / 2 : (i / Math.max(n - 1, 1)) * innerW);
  const yAt = (v: number) => pad.top + innerH - (v / maxY) * innerH;

  const ticks = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) =>
      Math.round((maxY * i) / steps)
    );
  }, [maxY]);

  function onMove(event: MouseEvent<SVGSVGElement>) {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      const dx = Math.abs(xAt(i) - px);
      if (dx < best) {
        best = dx;
        nearest = i;
      }
    }
    setHover({ index: nearest, x: xAt(nearest), y: pad.top });
  }

  const hoverLabel = hover ? labels[hover.index] : null;

  return (
    <figure className="rounded-2xl border border-border bg-card p-4">
      <figcaption className="mb-3 text-sm font-semibold text-foreground">
        {title}
      </figcaption>
      <div className="mb-3 flex flex-wrap gap-2">
        {series.map((s) => {
          const on = !hidden[s.name];
          return (
            <button
              key={s.name}
              type="button"
              aria-pressed={on}
              onClick={() =>
                setHidden((prev) => ({ ...prev, [s.name]: !prev[s.name] }))
              }
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                on
                  ? "border-border bg-background text-foreground"
                  : "border-transparent bg-muted text-muted-foreground line-through"
              }`}
            >
              <span
                className="inline-block h-2 w-4 rounded-sm"
                style={{
                  background: s.color,
                  opacity: on ? 1 : 0.35,
                }}
                aria-hidden
              />
              {s.name}
            </button>
          );
        })}
      </div>
      <div className="relative">
        <svg
          role="img"
          aria-label={title}
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={yAt(t)}
                y2={yAt(t)}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
              />
              <text
                x={pad.left - 6}
                y={yAt(t) + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={10}
              >
                {yFormatter(t)}
              </text>
            </g>
          ))}
          {labels.map((label, i) =>
            i % Math.ceil(n / 8) === 0 || i === n - 1 ? (
              <text
                key={label + i}
                x={xAt(i)}
                y={height - 10}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={10}
              >
                {formatDayLabel(label)}
              </text>
            ) : null
          )}
          {visible.map((s, si) => {
            if (s.type === "column") {
              const groupW = innerW / n;
              const barW = Math.max(4, (groupW * 0.55) / Math.max(visible.filter((v) => v.type === "column").length, 1));
              const colSeries = visible.filter((v) => v.type === "column");
              const colIndex = colSeries.indexOf(s);
              return (
                <g key={s.name}>
                  {s.values.map((v, i) => {
                    const cx = xAt(i) - (colSeries.length * barW) / 2 + colIndex * barW;
                    const y = yAt(v);
                    return (
                      <rect
                        key={i}
                        x={cx}
                        y={y}
                        width={barW}
                        height={Math.max(0, pad.top + innerH - y)}
                        fill={s.color}
                        opacity={hover?.index === i ? 1 : 0.85}
                        rx={2}
                      />
                    );
                  })}
                </g>
              );
            }
            const pts = s.values
              .map((v, i) => `${xAt(i)},${yAt(v)}`)
              .join(" ");
            const area = `${xAt(0)},${yAt(0)} ${pts} ${xAt(s.values.length - 1)},${yAt(0)}`;
            const gradId = `${gid}-fill-${si}`.replace(/:/g, "");
            return (
              <g key={s.name}>
                {s.fillOpacity ? (
                  <>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={s.color}
                          stopOpacity={s.fillOpacity}
                        />
                        <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <polygon points={area} fill={`url(#${gradId})`} />
                  </>
                ) : null}
                <polyline
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={s.strokeDasharray}
                  points={pts}
                />
                {s.values.map((v, i) => (
                  <circle
                    key={i}
                    cx={xAt(i)}
                    cy={yAt(v)}
                    r={
                      hover?.index === i
                        ? (s.geometrySize ?? 4) + 1
                        : s.geometrySize ?? 3
                    }
                    fill={s.color}
                  />
                ))}
              </g>
            );
          })}
          {hover ? (
            <line
              x1={hover.x}
              x2={hover.x}
              y1={pad.top}
              y2={pad.top + innerH}
              stroke="currentColor"
              className="text-foreground/30"
              strokeDasharray="3 3"
            />
          ) : null}
        </svg>
        {hover && hoverLabel ? (
          <div
            className="pointer-events-none absolute z-10 min-w-[10rem] rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-md"
            style={{
              left: `min(${(hover.x / width) * 100}%, calc(100% - 11rem))`,
              top: 8,
            }}
          >
            <p className="mb-1 font-medium text-foreground">
              {formatDayLabel(hoverLabel)}
            </p>
            <ul className="space-y-0.5">
              {visible.map((s) => (
                <li key={s.name} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-medium text-foreground">
                    {yFormatter(s.values[hover.index] ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-muted-foreground">
          Tableau des données
        </summary>
        <div className="mt-2 max-h-40 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-1 pr-2 font-medium">Période</th>
                {series.map((s) => (
                  <th key={s.name} className="py-1 pr-2 font-medium">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, i) => (
                <tr key={label + i} className="border-b border-border/60">
                  <td className="py-1 pr-2">{formatDayLabel(label)}</td>
                  {series.map((s) => (
                    <td key={s.name} className="py-1 pr-2">
                      {yFormatter(s.values[i] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
