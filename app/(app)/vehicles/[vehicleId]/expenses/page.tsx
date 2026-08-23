import { ExpenseCategory } from "@prisma/client";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getVehicleById } from "@/lib/data/vehicles";
import { formatCurrencyFromCents, formatDate } from "@/lib/utils";

const excludedCategories = new Set<ExpenseCategory>([
  ExpenseCategory.ACCESSORY,
  ExpenseCategory.MAINTENANCE,
  ExpenseCategory.REPAIR,
  ExpenseCategory.PARTS,
]);

export default async function VehicleExpensesPage({
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

  const expenses = vehicle.expenses.filter((expense) => !excludedCategories.has(expense.category));
  const total = expenses.reduce((sum, expense) => sum + expense.amountCents, BigInt(0));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Expenses</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Ownership costs that are not already represented by fuel, service, or upgrades.
        </p>
      </div>

      <div className="border-y border-[var(--border)] py-4">
        <p className="text-sm text-[var(--muted-foreground)]">Total general ownership cost</p>
        <p className="mt-2 text-3xl font-semibold">{formatCurrencyFromCents(total)}</p>
      </div>

      <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {expenses.length > 0 ? (
          expenses.map((expense) => (
            <div className="flex items-center justify-between gap-4 py-4" key={expense.id}>
              <div>
                <p className="font-medium">{expense.merchant ?? expense.category}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {formatDate(expense.occurredAt)} · {expense.category.replaceAll("_", " ")}
                </p>
              </div>
              <p className="font-medium">{formatCurrencyFromCents(expense.amountCents)}</p>
            </div>
          ))
        ) : (
          <div className="py-4 text-sm text-[var(--muted-foreground)]">No general ownership expenses yet.</div>
        )}
      </div>
    </div>
  );
}
