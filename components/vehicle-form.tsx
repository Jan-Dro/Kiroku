"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { createVehicleAction } from "@/app/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = {
  ok: false,
  error: "",
  vehicleId: "",
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

export function VehicleForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(createVehicleAction, initialState);

  useEffect(() => {
    if (state.ok && state.vehicleId) {
      router.push(`/vehicles/${state.vehicleId}`);
    }
  }, [router, state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a vehicle</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input id="nickname" name="nickname" placeholder="Tundra" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input id="year" name="year" placeholder="2024" required type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="make">Make</Label>
            <Input id="make" name="make" placeholder="Toyota" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input id="model" name="model" placeholder="Tundra" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trim">Trim</Label>
            <Input id="trim" name="trim" placeholder="SR5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuelType">Fuel type</Label>
            <select
              className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm"
              defaultValue=""
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
            <Input id="currentMileage" name="currentMileage" placeholder="14512" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Purchase price</Label>
            <Input id="purchasePrice" name="purchasePrice" placeholder="54800.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vin">VIN</Label>
            <Input id="vin" name="vin" placeholder="17-character VIN" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licensePlate">License plate</Label>
            <Input id="licensePlate" name="licensePlate" placeholder="ABC-1234" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="image">Vehicle photo</Label>
            <Input accept="image/jpeg,image/png,image/webp" id="image" name="image" type="file" />
            <p className="text-sm text-[var(--muted-foreground)]">
              Optional. JPEG, PNG, or WebP up to your configured upload size.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Ownership notes, quirks, or plans." />
          </div>
          {state.error ? (
            <p className="md:col-span-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {state.error}
            </p>
          ) : null}
          <div className="md:col-span-2">
            <Button disabled={pending} size="lg">
              {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Save vehicle
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
