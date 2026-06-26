"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import { isNoData, type ChartItem } from "@/types/report";

interface PitWallChartProps {
  /** Oldest → newest, possibly gap-filled (see `lib/calendar.ts`). */
  items: ChartItem[];
  selectedPeriod: string | null;
  onSelect: (period: string) => void;
  resolution: string;
}

interface ChartDatum {
  period: string;
  composite: number;
}

interface DotRenderProps {
  cx?: number;
  cy?: number;
  payload?: ChartDatum;
}

const AXIS_FILL = "#5a5a7a";
const LINE_COLOR = "#1e1e1e";

function levelColor(composite: number): string {
  if (composite >= 0.9) return "#a855f7"; // muito_acima
  if (composite >= 0.8) return "#f97316"; // acima
  if (composite >= 0.5) return "#00ff41"; // atendendo
  return "#f59e0b";                       // abaixo
}

const MONTHS_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function formatLabel(period: string, resolution: string): string {
  const [year, month, day] = period.split("-");
  const monthName = MONTHS_PT[Number(month) - 1];
  if (resolution === "monthly") {
    return `${monthName}/${year.slice(2)}`;
  }
  return `${monthName}/${day}`;
}

function ChartTooltip(
  resolution: string,
): (props: TooltipContentProps) => React.ReactNode {
  return function TooltipContent({ active, payload }) {
    if (!active || !payload?.length) return null;
    const datum = payload[0]?.payload as ChartDatum | undefined;
    if (!datum) return null;
    return (
      <div className="border border-border bg-surface px-2 py-1 font-mono text-xs">
        <p className="text-muted">{formatLabel(datum.period, resolution)}</p>
        <p className="tabular-nums text-foreground">
          {datum.composite.toFixed(2)}
        </p>
      </div>
    );
  };
}

/**
 * Performance history rendered as a filled area chart ("pit wall" telemetry
 * trace). Clicking a point selects its period, which drives the insight panel.
 * No-data slots are dropped so the trace stays continuous.
 */
export default function PitWallChart({
  items,
  selectedPeriod,
  onSelect,
  resolution,
}: PitWallChartProps) {
  const data: ChartDatum[] = items
    .filter((item): item is Exclude<ChartItem, { noData: true }> => !isNoData(item))
    .map((item) => ({ period: item.period, composite: item.composite }));

  function renderDot({ cx, cy, payload }: DotRenderProps): React.ReactElement {
    const selected = payload?.period === selectedPeriod;
    const color = levelColor(payload?.composite ?? 0);
    return (
      <circle
        cx={cx}
        cy={cy}
        r={selected ? 5 : 3}
        fill={color}
        stroke={color}
        strokeOpacity={selected ? 1 : 0.6}
        cursor="pointer"
      />
    );
  }

  return (
    <section
      aria-label="Histórico de desempenho por período"
      className="py-4"
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          onClick={(state) => {
            const label = state?.activeLabel;
            if (typeof label === "string") onSelect(label);
          }}
        >
          <defs>
            <linearGradient id="subtleFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.6} />
              <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="period"
            tickFormatter={(period: string) => formatLabel(period, resolution)}
            tick={{ fontFamily: "monospace", fontSize: 10, fill: AXIS_FILL }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis domain={[0, 1]} hide />
          <Tooltip
            cursor={{ stroke: "#1a1a1a" }}
            content={ChartTooltip(resolution)}
          />
          <Area
            type="monotone"
            dataKey="composite"
            stroke={LINE_COLOR}
            strokeWidth={1.5}
            fill="url(#subtleFill)"
            dot={renderDot}
            activeDot={(props: { cx?: number; cy?: number; payload?: ChartDatum }) => {
              const color = levelColor(props.payload?.composite ?? 0);
              return <circle cx={props.cx} cy={props.cy} r={6} fill={color} stroke={color} cursor="pointer" />;
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}
