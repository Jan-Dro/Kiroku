import Link from "next/link";
import { Fuel, Receipt, Wrench } from "lucide-react";
import { notFound } from "next/navigation";
import { FuelInsightsPanel } from "@/components/fuel-insights-panel";
import { requireUser } from "@/lib/auth";
import { getVehicleById } from "@/lib/data/vehicles";
import {
  averageMpg,
  getFuelSpendThisMonth,
  getReminderSummary,
  getServiceSpendThisYear,
  ownershipCosts,
  recentMpg,
} from "@/lib/vehicle-insights";
import { formatCurrencyFromCents, formatDate, formatNumber } from "@/lib/utils";

export default async function VehicleOverviewPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const user = await requireUser();
  const { vehicleId } = await params;
  const vehicle = await getVehicleById(user.id, vehicleId);

  if (!vehicle) {
    notFound();
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const mpgAverage = averageMpg(vehicle.fuelEntries);
  const recentFuelMpg = recentMpg(vehicle.fuelEntries);
  const fuelSpendThisMonth = getFuelSpendThisMonth(vehicle.fuelEntries, monthStart);
  const serviceSpendThisYear = getServiceSpendThisYear(vehicle.maintenanceRecords, yearStart);
  const costs = ownershipCosts(vehicle.fuelEntries, vehicle.maintenanceRecords, vehicle.expenses);

  return (
    <div className="space-y-12">
      <section className="grid gap-10 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Average MPG</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {mpgAverage ? formatNumber(mpgAverage) : "—"}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Full-tank fill-ups only</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Fuel spend</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{formatCurrencyFromCents(fuelSpendThisMonth)}</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">This month</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Service spend</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {formatCurrencyFromCents(serviceSpendThisYear)}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">This year</p>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Fuel Economy</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  MPG trend and fuel efficiency signals for this vehicle.
                </p>
              </div>
              <Link className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]" href={`/vehicles/${vehicle.id}/fuel`}>
                View fuel →
              </Link>
            </div>
            <FuelInsightsPanel
              entries={vehicle.fuelEntries.map((entry) => ({
                id: entry.id,
                occurredAt: entry.occurredAt.toISOString(),
                odometer: entry.odometer,
                totalCostCents: entry.totalCostCents.toString(),
                calculatedEconomy: entry.calculatedEconomy ? Number(entry.calculatedEconomy.toString()) : null,
                pricePerUnit: Number(entry.pricePerUnit.toString()),
                calculatedDistance: entry.calculatedDistance,
                volume: Number(entry.volume.toString()),
                station: entry.station,
              }))}
            />
          </section>
        </div>

        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Upcoming Maintenance</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">The most relevant service items next.</p>
              </div>
              <Link className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]" href={`/vehicles/${vehicle.id}/service`}>
                View maintenance →
              </Link>
            </div>
            <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {vehicle.reminders.length > 0 ? (
                vehicle.reminders.slice(0, 3).map((reminder) => {
                  const summary = getReminderSummary(reminder, vehicle.currentMileage);

                  return (
                    <div className="flex items-start justify-between gap-4 py-4" key={reminder.id}>
                      <div>
                        <p className="font-medium">{reminder.title}</p>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{summary.label}</p>
                      </div>
                      {summary.overdue ? (
                        <span className="rounded-full bg-[rgba(239,68,68,0.12)] px-3 py-1 text-xs font-medium text-[oklch(0.7_0.18_25)]">
                          Overdue
                        </span>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-sm text-[var(--muted-foreground)]">No maintenance reminders yet.</div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Cost of Ownership</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Current cost breakdown from the data recorded so far.
              </p>
            </div>
            <div className="space-y-4 border-y border-[var(--border)] py-4">
              {[
                { label: "Fuel", value: costs.fuel, icon: Fuel },
                { label: "Service / repairs", value: costs.service, icon: Wrench },
                { label: "Upgrades", value: costs.upgrades, icon: Receipt },
                { label: "Other ownership", value: costs.other, icon: Receipt },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div className="flex items-center justify-between gap-4" key={item.label}>
                    <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </p>
                    <p className="font-medium">{formatCurrencyFromCents(item.value)}</p>
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
                <p className="text-sm text-[var(--muted-foreground)]">Total ownership cost</p>
                <p className="text-xl font-semibold">{formatCurrencyFromCents(costs.total)}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Vehicle Health Snapshot</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                A quick read on how this vehicle is doing right now.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-l border-[var(--border)] pl-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Most recent MPG</p>
                <p className="mt-2 text-2xl font-semibold">{recentFuelMpg ? formatNumber(recentFuelMpg) : "—"}</p>
              </div>
              <div className="border-l border-[var(--border)] pl-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Last service</p>
                <p className="mt-2 text-2xl font-semibold">
                  {vehicle.maintenanceRecords[0] ? formatDate(vehicle.maintenanceRecords[0].occurredAt, { month: "short", day: "numeric" }) : "—"}
                </p>
              </div>
              <div className="border-l border-[var(--border)] pl-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Purchase price</p>
                <p className="mt-2 text-2xl font-semibold">
                  {vehicle.purchasePriceCents ? formatCurrencyFromCents(vehicle.purchasePriceCents) : "—"}
                </p>
              </div>
              <div className="border-l border-[var(--border)] pl-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Purchase mileage</p>
                <p className="mt-2 text-2xl font-semibold">
                  {vehicle.purchaseMileage !== null ? `${formatNumber(vehicle.purchaseMileage, 0)} mi` : "—"}
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
