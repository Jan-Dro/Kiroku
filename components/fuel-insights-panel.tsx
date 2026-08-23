"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { averageFuelPrice, averageMpg, bestMpg, costPerMile, filterFuelEntriesByMonths, recentMpg, totalFuelCost, totalGallons } from "@/lib/vehicle-insights";
import { cn, formatCurrencyFromCents, formatDate, formatNumber } from "@/lib/utils";

type FuelEntryChartInput = {
  id: string;
  occurredAt: string;
  odometer: number;
  totalCostCents: string;
  calculatedEconomy: number | null;
  pricePerUnit: number;
  calculatedDistance: number | null;
  volume: number;
  station: string | null;
};

const ranges = [
  { label: "3 months", value: 3 },
  { label: "6 months", value: 6 },
  { label: "12 months", value: 12 },
  { label: "All time", value: null },
] as const;

export function FuelInsightsPanel({ entries }: { entries: FuelEntryChartInput[] }) {
  const [range, setRange] = useState<(typeof ranges)[number]["value"]>(6);

  const normalizedEntries = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        occurredAt: new Date(entry.occurredAt),
        totalCostCents: BigInt(entry.totalCostCents),
        pricePerUnit: entry.pricePerUnit,
      })),
    [entries],
  );

  const filteredEntries = useMemo(
    () => filterFuelEntriesByMonths(normalizedEntries, range),
    [normalizedEntries, range],
  );

  const chartData = filteredEntries
    .filter((entry) => entry.calculatedEconomy !== null)
    .map((entry) => ({
      label: formatDate(entry.occurredAt, { month: "short", day: "numeric" }),
      mpg: entry.calculatedEconomy,
      price: entry.pricePerUnit,
      cost: Number(entry.totalCostCents) / 100,
    }));

  const stats = {
    averageMpg: averageMpg(filteredEntries),
    bestMpg: bestMpg(filteredEntries),
    recentMpg: recentMpg(filteredEntries),
    averagePrice: averageFuelPrice(filteredEntries),
    totalGallons: totalGallons(filteredEntries),
    totalFuelCost: totalFuelCost(filteredEntries),
    costPerMile: costPerMile(filteredEntries),
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {ranges.map((item) => (
          <button
            className={cn(
              "border-b-2 px-1 py-1.5 text-sm transition-colors",
              item.value === range
                ? "border-[oklch(0.58_0.16_255)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
            key={item.label}
            onClick={() => setRange(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="h-72">
        {chartData.length > 1 ? (
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="mpgFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.58 0.16 255)" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="oklch(0.58 0.16 255)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={36} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                }}
                formatter={(value) =>
                  typeof value === "number" ? [`${value.toFixed(1)} MPG`, "MPG"] : [String(value ?? ""), "MPG"]
                }
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Area dataKey="mpg" stroke="oklch(0.58 0.16 255)" fill="url(#mpgFill)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center border-y border-[var(--border)] text-sm text-[var(--muted-foreground)]">
            Add full-tank fuel entries to see MPG trends.
          </div>
        )}
      </div>

      <div className="grid gap-5 border-y border-[var(--border)] py-5 sm:grid-cols-2 xl:grid-cols-5">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Average MPG</p>
          <p className="mt-2 text-2xl font-semibold">
            {stats.averageMpg ? formatNumber(stats.averageMpg) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Best MPG</p>
          <p className="mt-2 text-2xl font-semibold">
            {stats.bestMpg ? formatNumber(stats.bestMpg) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Recent MPG</p>
          <p className="mt-2 text-2xl font-semibold">
            {stats.recentMpg ? formatNumber(stats.recentMpg) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Avg fuel price</p>
          <p className="mt-2 text-2xl font-semibold">
            {stats.averagePrice ? `$${formatNumber(stats.averagePrice, 2)}` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Cost per mile</p>
          <p className="mt-2 text-2xl font-semibold">
            {stats.costPerMile ? `$${formatNumber(stats.costPerMile, 2)}` : "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Total gallons</p>
          <p className="mt-2 text-xl font-semibold">{formatNumber(stats.totalGallons, 1)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Fuel cost</p>
          <p className="mt-2 text-xl font-semibold">{formatCurrencyFromCents(stats.totalFuelCost)}</p>
        </div>
      </div>
    </section>
  );
}
