import Link from "next/link";
import { Fuel, Gauge, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyFromCents, formatDate, formatNumber } from "@/lib/utils";
import type { getVehiclesForUser } from "@/lib/data/vehicles";

type VehicleCardProps = Awaited<ReturnType<typeof getVehiclesForUser>>[number];

export function VehicleCard({ vehicle }: { vehicle: VehicleCardProps }) {
  const lastFuel = vehicle.fuelEntries[0];
  const lastMaintenance = vehicle.maintenanceRecords[0];

  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <Card className="h-full transition-transform duration-200 hover:-translate-y-1">
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                {vehicle.year} {vehicle.make}
              </p>
              <CardTitle className="mt-2 text-2xl">
                {vehicle.nickname}
              </CardTitle>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {vehicle.model}
                {vehicle.trim ? ` ${vehicle.trim}` : ""}
              </p>
            </div>
            <Badge>{vehicle.fuelType ?? "Vehicle"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-[var(--muted)] p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                <Gauge className="h-3.5 w-3.5" />
                Mileage
              </p>
              <p className="mt-3 text-xl font-semibold">
                {vehicle.currentMileage ? formatNumber(vehicle.currentMileage, 0) : "Not set"}
              </p>
            </div>
            <div className="rounded-3xl bg-[var(--muted)] p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                <Fuel className="h-3.5 w-3.5" />
                Last Fill
              </p>
              <p className="mt-3 text-xl font-semibold">
                {lastFuel ? formatDate(lastFuel.occurredAt, { month: "short", day: "numeric" }) : "No fuel"}
              </p>
            </div>
          </div>
          <div className="space-y-2 rounded-3xl border border-[var(--border)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Latest maintenance
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  <Wrench className="h-4 w-4" />
                  {lastMaintenance?.title ?? "Nothing logged yet"}
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {lastMaintenance ? formatDate(lastMaintenance.occurredAt) : "Start with a service entry"}
                </p>
              </div>
              <p className="shrink-0 text-sm text-[var(--muted-foreground)]">
                {lastMaintenance ? formatCurrencyFromCents(lastMaintenance.totalCostCents) : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
