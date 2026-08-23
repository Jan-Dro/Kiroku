import { ExpenseCategory } from "@prisma/client";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getVehicleById } from "@/lib/data/vehicles";
import { formatCurrencyFromCents, formatDate } from "@/lib/utils";

export default async function VehicleUpgradesPage({
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

  const upgrades = vehicle.expenses.filter((expense) => expense.category === ExpenseCategory.ACCESSORY);
  const total = upgrades.reduce((sum, expense) => sum + expense.amountCents, BigInt(0));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Upgrades</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Modification history and build-sheet cost for this vehicle.
        </p>
      </div>

      <div className="border-y border-[var(--border)] py-4">
        <p className="text-sm text-[var(--muted-foreground)]">Total build / modification cost</p>
        <p className="mt-2 text-3xl font-semibold">{formatCurrencyFromCents(total)}</p>
      </div>

      <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {upgrades.length > 0 ? (
          upgrades.map((upgrade) => (
            <div className="flex items-center justify-between gap-4 py-4" key={upgrade.id}>
              <div>
                <p className="font-medium">{upgrade.merchant ?? "Upgrade"}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{formatDate(upgrade.occurredAt)}</p>
                {upgrade.notes ? <p className="mt-2 text-sm text-[var(--muted-foreground)]">{upgrade.notes}</p> : null}
              </div>
              <p className="font-medium">{formatCurrencyFromCents(upgrade.amountCents)}</p>
            </div>
          ))
        ) : (
          <div className="py-4 text-sm text-[var(--muted-foreground)]">No upgrades recorded yet.</div>
        )}
      </div>
    </div>
  );
}
