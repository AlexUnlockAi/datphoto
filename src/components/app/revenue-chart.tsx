"use client";

import { useState } from "react";
import { formatCents } from "@/lib/money";

export type MonthlyRevenue = { label: string; cents: number };

export function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.cents));

  const width = 640;
  const height = 180;
  const padding = { top: 12, right: 8, bottom: 24, left: 8 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const barGap = 10;
  const barW = (plotW - barGap * (data.length - 1)) / data.length;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Monthly revenue"
      >
        {/* recessive baseline */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="var(--border)"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const barH = Math.max(2, (d.cents / max) * plotH);
          const x = padding.left + i * (barW + barGap);
          const y = height - padding.bottom - barH;
          const isHover = hover === i;
          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="cursor-default"
            >
              {/* wider invisible hit target */}
              <rect
                x={x - barGap / 2}
                y={padding.top}
                width={barW + barGap}
                height={plotH}
                fill="transparent"
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                fill="var(--primary)"
                opacity={isHover ? 1 : 0.75}
              />
              <text
                x={x + barW / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize="10"
                fill="var(--muted-foreground)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-lg">
          <p className="font-medium">{data[hover].label}</p>
          <p className="text-primary">{formatCents(data[hover].cents)}</p>
        </div>
      )}
    </div>
  );
}
