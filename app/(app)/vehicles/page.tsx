import Link from "next/link";
import { Plus } from "lucide-react";
import { VehicleCard } from "@/components/vehicle-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getVehiclesForUser } from "@/lib/data/vehicles";

export default async function VehiclesPage() {
  const user = await requireUser();
  const vehicles = await getVehiclesForUser(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Vehicles</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Your garage</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
            Each vehicle page acts as the home for history, analytics, costs, reminders, and documents.
          </p>
        </div>
        <Button asChild>
          <Link href="/vehicles/new">
            <Plus className="h-4 w-4" />
            Add vehicle
          </Link>
        </Button>
      </div>
      {vehicles.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No vehicles yet</CardTitle>
            <CardDescription>Create the first vehicle to start tracking real data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/vehicles/new">Create vehicle</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
