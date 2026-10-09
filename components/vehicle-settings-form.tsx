"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recalculateVehicleMileageAction, updateVehicleSettingsAction } from "@/app/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = {
  ok: false,
  error: "",
};

const fuelTypes = [
  "GASOLINE",
  "DIESEL",
  "E85",
  "PREMIUM",
  "ELECTRIC",
  "HYBRID",
  "OTHER",
] as const;

export function VehicleSettingsForm({
  vehicle,
}: {
  vehicle: {
    id: string;
    nickname: string;
    year: number;
    make: string;
    model: string;
    trim: string | null;
    vin: string | null;
    licensePlate: string | null;
    purchaseDate: Date | null;
    purchaseMileage: number | null;
    currentMileage: number | null;
    purchasePriceCents: bigint | null;
    engine: string | null;
    drivetrain: string | null;
    transmission: string | null;
    fuelType: string | null;
    exteriorColor: string | null;
    notes: string | null;
  };
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateVehicleSettingsAction, initialState);
  const [recalculateError, setRecalculateError] = useState<string | null>(null);
  const [recalculating, startRecalculate] = useTransition();

  return (
    <div className="space-y-6">
      <form action={action} className="grid gap-5 md:grid-cols-2">
        <input name="vehicleId" type="hidden" value={vehicle.id} />

        <div className="space-y-2">
          <Label htmlFor="nickname">Nickname</Label>
          <Input defaultValue={vehicle.nickname} id="nickname" name="nickname" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input defaultValue={vehicle.year} id="year" name="year" required type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="make">Make</Label>
          <Input defaultValue={vehicle.make} id="make" name="make" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input defaultValue={vehicle.model} id="model" name="model" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trim">Trim</Label>
          <Input defaultValue={vehicle.trim ?? ""} id="trim" name="trim" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuelType">Fuel type</Label>
          <select
            className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm"
            defaultValue={vehicle.fuelType ?? ""}
            id="fuelType"
            name="fuelType"
          >
            <option value="">Select fuel type</option>
            {fuelTypes.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentMileage">Current mileage</Label>
          <Input defaultValue={vehicle.currentMileage ?? ""} id="currentMileage" name="currentMileage" type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchaseMileage">Purchase mileage</Label>
          <Input defaultValue={vehicle.purchaseMileage ?? ""} id="purchaseMileage" name="purchaseMileage" type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Purchase date</Label>
          <Input
            defaultValue={vehicle.purchaseDate ? vehicle.purchaseDate.toISOString().slice(0, 10) : ""}
            id="purchaseDate"
            name="purchaseDate"
            type="date"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchasePrice">Purchase price</Label>
          <Input
            defaultValue={vehicle.purchasePriceCents !== null ? (Number(vehicle.purchasePriceCents) / 100).toFixed(2) : ""}
            id="purchasePrice"
            name="purchasePrice"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vin">VIN</Label>
          <Input defaultValue={vehicle.vin ?? ""} id="vin" name="vin" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="licensePlate">License plate</Label>
          <Input defaultValue={vehicle.licensePlate ?? ""} id="licensePlate" name="licensePlate" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="engine">Engine</Label>
          <Input defaultValue={vehicle.engine ?? ""} id="engine" name="engine" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="drivetrain">Drivetrain</Label>
          <Input defaultValue={vehicle.drivetrain ?? ""} id="drivetrain" name="drivetrain" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="transmission">Transmission</Label>
          <Input defaultValue={vehicle.transmission ?? ""} id="transmission" name="transmission" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exteriorColor">Exterior color</Label>
          <Input defaultValue={vehicle.exteriorColor ?? ""} id="exteriorColor" name="exteriorColor" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea defaultValue={vehicle.notes ?? ""} id="notes" name="notes" />
        </div>

        {state.error ? (
          <p className="md:col-span-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {state.error}
          </p>
        ) : null}

        {state.ok ? (
          <p className="md:col-span-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Vehicle settings updated.
          </p>
        ) : null}

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <Button disabled={pending}>{pending ? "Saving..." : "Save changes"}</Button>
          <Button
            disabled={recalculating}
            onClick={() => {
              startRecalculate(async () => {
                const formData = new FormData();
                formData.set("vehicleId", vehicle.id);
                const result = await recalculateVehicleMileageAction(formData);

                if (!result.ok) {
                  setRecalculateError(result.error || "Unable to recalculate mileage.");
                  return;
                }

                setRecalculateError(null);
                router.refresh();
              });
            }}
            type="button"
            variant="outline"
          >
            {recalculating ? "Recalculating..." : "Recalculate mileage now"}
          </Button>
          {recalculateError ? <p className="text-sm text-amber-300">{recalculateError}</p> : null}
        </div>
      </form>
    </div>
  );
}
