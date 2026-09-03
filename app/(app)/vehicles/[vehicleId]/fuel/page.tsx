import { FuelInsightsPanel } from "@/components/fuel-insights-panel";
import { DeleteFuelEntryButton } from "@/components/delete-fuel-entry-button";
import { requireUser } from "@/lib/auth";
import { getVehicleById } from "@/lib/data/vehicles";
import { averageMpg, averageFuelPrice, bestMpg, costPerMile, totalFuelCost, totalGallons } from "@/lib/vehicle-insights";
import { formatCurrencyFromCents, formatDate, formatNumber } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function VehicleFuelPage({
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

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Fuel</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            MPG trends, fuel costs, and complete fill-up history for this vehicle.
          </p>
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Average MPG</p>
          <p className="mt-2 text-2xl font-semibold">{averageMpg(vehicle.fuelEntries) ? formatNumber(averageMpg(vehicle.fuelEntries) ?? 0) : "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Best MPG</p>
          <p className="mt-2 text-2xl font-semibold">{bestMpg(vehicle.fuelEntries) ? formatNumber(bestMpg(vehicle.fuelEntries) ?? 0) : "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Average price</p>
          <p className="mt-2 text-2xl font-semibold">{averageFuelPrice(vehicle.fuelEntries) ? `$${formatNumber(averageFuelPrice(vehicle.fuelEntries) ?? 0, 2)}` : "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Total gallons</p>
          <p className="mt-2 text-2xl font-semibold">{formatNumber(totalGallons(vehicle.fuelEntries), 1)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Cost per mile</p>
          <p className="mt-2 text-2xl font-semibold">{costPerMile(vehicle.fuelEntries) ? `$${formatNumber(costPerMile(vehicle.fuelEntries) ?? 0, 2)}` : "—"}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight">Fill-up history</h3>
          <p className="text-sm text-[var(--muted-foreground)]">{formatCurrencyFromCents(totalFuelCost(vehicle.fuelEntries))} total</p>
        </div>
        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {vehicle.fuelEntries.length > 0 ? (
            vehicle.fuelEntries.map((entry) => (
              <div className="flex items-center justify-between gap-4 py-4" key={entry.id}>
                <div>
                  <p className="font-medium">{entry.station ?? "Fuel entry"}</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {formatDate(entry.occurredAt)} · {formatNumber(entry.odometer, 0)} mi · {entry.volume.toString()} gal
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrencyFromCents(entry.totalCostCents)}</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {entry.calculatedEconomy ? `${formatNumber(Number(entry.calculatedEconomy.toString()))} MPG` : "Partial fill"}
                  </p>
                  <div className="mt-2 flex justify-end">
                    <DeleteFuelEntryButton fuelEntryId={entry.id} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-sm text-[var(--muted-foreground)]">No fuel entries yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
