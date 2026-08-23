import { VehicleForm } from "@/components/vehicle-form";

export default function NewVehiclePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Vehicles</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Add a vehicle</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
          Start with the ownership and mileage details. Fuel, maintenance, expenses, and reminders layer on top.
        </p>
      </div>
      <VehicleForm />
    </div>
  );
}
