import { notFound } from "next/navigation";
import { VehicleSettingsForm } from "@/components/vehicle-settings-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function VehicleSettingsPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const user = await requireUser();
  const { vehicleId } = await params;

  const vehicle = await db.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId: user.id,
    },
    select: {
      id: true,
      nickname: true,
      year: true,
      make: true,
      model: true,
      trim: true,
      vin: true,
      licensePlate: true,
      purchaseDate: true,
      purchaseMileage: true,
      currentMileage: true,
      purchasePriceCents: true,
      engine: true,
      drivetrain: true,
      transmission: true,
      fuelType: true,
      exteriorColor: true,
      notes: true,
    },
  });

  if (!vehicle) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Vehicle settings</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Update vehicle details and repair mileage if data was entered incorrectly.
        </p>
      </div>
      <VehicleSettingsForm vehicle={vehicle} />
    </section>
  );
}
