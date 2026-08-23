"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect, useMemo, useState } from "react";
import { ChevronDown, FileText, Fuel, Plus, Receipt, Sparkles, Wrench, X } from "lucide-react";
import {
  createExpenseAction,
  createFuelEntryAction,
  createMaintenanceRecordAction,
  createVehicleNoteAction,
} from "@/app/actions/vehicles";
import { getLocalDateInputValue } from "@/lib/client-date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState = {
  ok: false,
  error: "",
};

export type VehicleRecordType = "fuel" | "maintenance" | "expense" | "upgrade" | "note";

const recordTypes: Array<{
  value: VehicleRecordType;
  label: string;
  description: string;
  icon: typeof Fuel;
}> = [
  { value: "fuel", label: "Fuel", description: "Fast fill-up entry with odometer, gallons, and price.", icon: Fuel },
  { value: "maintenance", label: "Service", description: "Service, repair, inspection, or upgrade.", icon: Wrench },
  { value: "expense", label: "Expense", description: "Insurance, tolls, parking, or other costs.", icon: Receipt },
  { value: "upgrade", label: "Upgrade", description: "Modification, accessory, or build-sheet item.", icon: Sparkles },
  { value: "note", label: "Note", description: "Observation, symptom, or follow-up item.", icon: FileText },
];

function ErrorText({ error }: { error: string }) {
  return error ? <p className="text-sm text-amber-300">{error}</p> : null;
}

function NotesArea({
  id,
  name,
  placeholder,
}: {
  id: string;
  name: string;
  placeholder: string;
}) {
  return (
    <textarea
      className="min-h-[110px] w-full rounded-[22px] border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-sm outline-none"
      id={id}
      name={name}
      placeholder={placeholder}
    />
  );
}

export function VehicleAddRecordDialog({
  vehicleId,
  latestMileage,
  initialRecordType,
  triggerLabel = "Add record",
}: {
  vehicleId: string;
  latestMileage: number | null;
  initialRecordType?: VehicleRecordType;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [recordType, setRecordType] = useState<VehicleRecordType>(initialRecordType ?? "fuel");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [volume, setVolume] = useState("");
  const [showFuelOptions, setShowFuelOptions] = useState(false);
  const [localDate, setLocalDate] = useState(getLocalDateInputValue());
  const [fuelState, fuelAction, fuelPending] = useActionState(createFuelEntryAction, initialState);
  const [serviceState, serviceAction, servicePending] = useActionState(createMaintenanceRecordAction, initialState);
  const [expenseState, expenseAction, expensePending] = useActionState(createExpenseAction, initialState);
  const [noteState, noteAction, notePending] = useActionState(createVehicleNoteAction, initialState);

  useEffect(() => {
    setLocalDate(getLocalDateInputValue());
  }, []);

  useEffect(() => {
    if (open) {
      setRecordType(initialRecordType ?? "fuel");
    }
  }, [initialRecordType, open]);

  useEffect(() => {
    if (fuelState.ok || serviceState.ok || expenseState.ok || noteState.ok) {
      setOpen(false);
      setShowFuelOptions(false);
      setPricePerUnit("");
      setVolume("");
    }
  }, [expenseState.ok, fuelState.ok, noteState.ok, serviceState.ok]);

  const fuelTotal = useMemo(() => {
    const gallons = Number(volume);
    const price = Number(pricePerUnit);

    if (Number.isNaN(gallons) || Number.isNaN(price) || gallons <= 0 || price <= 0) {
      return null;
    }

    return gallons * price;
  }, [pricePerUnit, volume]);

  const shouldShowChooser = initialRecordType === undefined;
  const mileageDefault = latestMileage !== null ? String(latestMileage) : "";

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Button className="w-full sm:w-auto" onClick={() => setOpen(true)} size="lg" type="button">
        <Plus className="h-4 w-4" />
        {triggerLabel}
      </Button>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(2,6,23,0.58)] backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[28px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl md:inset-auto md:left-1/2 md:top-1/2 md:w-[min(760px,calc(100vw-2rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[28px] md:p-6">
          <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-[var(--border)] md:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-2xl font-semibold tracking-tight">{triggerLabel}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-[var(--muted-foreground)]">
                {shouldShowChooser
                  ? "Choose one record type and only the relevant fields will appear."
                  : "Only the fields relevant to this entry are shown."}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="rounded-full p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {shouldShowChooser ? (
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {recordTypes.map((item) => {
                const Icon = item.icon;
                const active = recordType === item.value;
                return (
                  <button
                    className={cn(
                      "rounded-[22px] border px-4 py-4 text-left transition-colors",
                      active
                        ? "border-[oklch(0.58_0.16_255)] bg-[color-mix(in_oklab,oklch(0.58_0.16_255)_14%,var(--card))]"
                        : "border-[var(--border)] bg-transparent hover:bg-[var(--muted)]",
                    )}
                    key={item.value}
                    onClick={() => setRecordType(item.value)}
                    type="button"
                  >
                    <p className="flex items-center gap-2 font-medium">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">{item.description}</p>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className={cn("border-[var(--border)] pt-6", shouldShowChooser ? "mt-6 border-t" : "mt-4")}>
            {recordType === "fuel" ? (
              <form action={fuelAction} className="grid gap-4 sm:grid-cols-2">
                <input name="vehicleId" type="hidden" value={vehicleId} />
                <div className="space-y-2">
                  <Label htmlFor="fuel-odometer">Odometer</Label>
                  <Input defaultValue={mileageDefault} id="fuel-odometer" name="odometer" placeholder="14512" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel-volume">Gallons</Label>
                  <Input
                    id="fuel-volume"
                    name="volume"
                    onChange={(event) => setVolume(event.target.value)}
                    placeholder="18.2"
                    step="0.001"
                    type="number"
                    value={volume}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel-price">Price per gallon</Label>
                  <Input
                    id="fuel-price"
                    name="pricePerUnit"
                    onChange={(event) => setPricePerUnit(event.target.value)}
                    placeholder="3.45"
                    step="0.001"
                    type="number"
                    value={pricePerUnit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel-station">Station</Label>
                  <Input id="fuel-station" name="station" placeholder="Shell" />
                </div>
                <div className="sm:col-span-2 rounded-[22px] bg-[var(--muted)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Calculated total</p>
                  <p className="mt-2 text-xl font-semibold">
                    {fuelTotal !== null ? `$${fuelTotal.toFixed(2)}` : "Enter gallons and price"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <button
                    className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                    onClick={() => setShowFuelOptions((value) => !value)}
                    type="button"
                  >
                    More options
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showFuelOptions ? "rotate-180" : "")} />
                  </button>
                </div>
                {showFuelOptions ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fuel-date">Date</Label>
                      <Input defaultValue={localDate} id="fuel-date" name="occurredAt" type="date" />
                    </div>
                    <div className="flex items-end pb-3">
                      <label className="flex items-center gap-3 text-sm">
                        <input className="h-4 w-4" defaultChecked name="isFullTank" type="checkbox" />
                        Full tank
                      </label>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="fuel-notes">Notes</Label>
                      <NotesArea id="fuel-notes" name="notes" placeholder="Optional fill-up notes." />
                    </div>
                  </>
                ) : (
                  <>
                    <input name="occurredAt" type="hidden" value={localDate} />
                    <input name="isFullTank" type="hidden" value="on" />
                  </>
                )}
                <div className="sm:col-span-2">
                  <ErrorText error={fuelState.error} />
                </div>
                <div className="sm:col-span-2">
                  <Button disabled={fuelPending}>Save fuel entry</Button>
                </div>
              </form>
            ) : null}

            {recordType === "maintenance" ? (
              <form action={serviceAction} className="grid gap-4 sm:grid-cols-2">
                <input name="vehicleId" type="hidden" value={vehicleId} />
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="service-title">Service type / title</Label>
                  <Input id="service-title" name="title" placeholder="Synthetic oil service" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-date">Date</Label>
                  <Input defaultValue={localDate} id="service-date" name="occurredAt" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-odometer">Odometer</Label>
                  <Input defaultValue={mileageDefault} id="service-odometer" name="odometer" placeholder="14512" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-provider">Shop / provider</Label>
                  <Input id="service-provider" name="provider" placeholder="Dealer or local shop" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-totalCost">Cost</Label>
                  <Input id="service-totalCost" name="totalCost" placeholder="71.80" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="service-notes">Notes</Label>
                  <NotesArea id="service-notes" name="notes" placeholder="Parts used, findings, or service details." />
                </div>
                <div className="sm:col-span-2">
                  <ErrorText error={serviceState.error} />
                </div>
                <div className="sm:col-span-2">
                  <Button disabled={servicePending}>Save maintenance record</Button>
                </div>
              </form>
            ) : null}

            {recordType === "expense" ? (
              <form action={expenseAction} className="grid gap-4 sm:grid-cols-2">
                <input name="vehicleId" type="hidden" value={vehicleId} />
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Amount</Label>
                  <Input id="expense-amount" name="amount" placeholder="129.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Date</Label>
                  <Input defaultValue={localDate} id="expense-date" name="occurredAt" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-merchant">Merchant</Label>
                  <Input id="expense-merchant" name="merchant" placeholder="Insurance company, toll road..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Category</Label>
                  <select
                    className="flex h-11 w-full rounded-[22px] border border-[var(--border)] bg-[var(--input)] px-4 text-sm outline-none"
                    defaultValue="OTHER"
                    id="expense-category"
                    name="category"
                  >
                    <option value="INSURANCE">Insurance</option>
                    <option value="REGISTRATION">Registration</option>
                    <option value="INSPECTION">Inspection</option>
                    <option value="PARKING">Parking</option>
                    <option value="TOLLS">Tolls</option>
                    <option value="DETAILING">Detailing</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="expense-odometer">Odometer, optional</Label>
                  <Input defaultValue={mileageDefault} id="expense-odometer" name="odometer" placeholder="14512" type="number" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="expense-notes">Notes</Label>
                  <NotesArea id="expense-notes" name="notes" placeholder="Optional context for the purchase." />
                </div>
                <div className="sm:col-span-2">
                  <ErrorText error={expenseState.error} />
                </div>
                <div className="sm:col-span-2">
                  <Button disabled={expensePending}>Save expense</Button>
                </div>
              </form>
            ) : null}

            {recordType === "upgrade" ? (
              <form action={expenseAction} className="grid gap-4 sm:grid-cols-2">
                <input name="vehicleId" type="hidden" value={vehicleId} />
                <input name="category" type="hidden" value="ACCESSORY" />
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="upgrade-merchant">Title / vendor</Label>
                  <Input id="upgrade-merchant" name="merchant" placeholder="Method wheels, tint shop, suspension kit..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upgrade-date">Date</Label>
                  <Input defaultValue={localDate} id="upgrade-date" name="occurredAt" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upgrade-odometer">Odometer</Label>
                  <Input defaultValue={mileageDefault} id="upgrade-odometer" name="odometer" placeholder="14512" type="number" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="upgrade-amount">Cost</Label>
                  <Input id="upgrade-amount" name="amount" placeholder="1299.00" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="upgrade-notes">Notes</Label>
                  <NotesArea id="upgrade-notes" name="notes" placeholder="Vendor, installer, parts details, or build notes." />
                </div>
                <div className="sm:col-span-2">
                  <ErrorText error={expenseState.error} />
                </div>
                <div className="sm:col-span-2">
                  <Button disabled={expensePending}>Save upgrade</Button>
                </div>
              </form>
            ) : null}

            {recordType === "note" ? (
              <form action={noteAction} className="grid gap-4 sm:grid-cols-2">
                <input name="vehicleId" type="hidden" value={vehicleId} />
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="note-title">Title</Label>
                  <Input id="note-title" name="title" placeholder="Rear brake squeak" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note-date">Date</Label>
                  <Input defaultValue={localDate} id="note-date" name="occurredAt" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note-odometer">Odometer</Label>
                  <Input defaultValue={mileageDefault} id="note-odometer" name="odometer" placeholder="14512" type="number" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="note-body">Note</Label>
                  <NotesArea id="note-body" name="notes" placeholder="Write what happened, what you heard, or what to follow up on next." />
                </div>
                <div className="sm:col-span-2">
                  <ErrorText error={noteState.error} />
                </div>
                <div className="sm:col-span-2">
                  <Button disabled={notePending}>Save note</Button>
                </div>
              </form>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
