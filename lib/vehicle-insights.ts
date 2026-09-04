import { ExpenseCategory } from "@prisma/client";

type FuelEntryLike = {
  occurredAt: Date;
  odometer: number;
  volume: { toString(): string } | string;
  pricePerUnit: { toString(): string } | string;
  totalCostCents: bigint;
  calculatedEconomy: { toString(): string } | string | null;
  calculatedDistance: number | null;
};

type MaintenanceRecordLike = {
  occurredAt: Date;
  totalCostCents: bigint;
};

type ExpenseLike = {
  occurredAt: Date;
  amountCents: bigint;
  category: ExpenseCategory;
};

type ReminderLike = {
  title: string;
  status: string;
  intervalDistance: number | null;
  intervalMonths: number | null;
  lastCompletedAt: Date | null;
  lastCompletedOdometer: number | null;
};

export function decimalToNumber(value: { toString(): string } | string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value.toString());
}

export function averageMpg(entries: FuelEntryLike[]) {
  const values = entries
    .map((entry) => decimalToNumber(entry.calculatedEconomy))
    .filter((value): value is number => value !== null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function bestMpg(entries: FuelEntryLike[]) {
  const values = entries
    .map((entry) => decimalToNumber(entry.calculatedEconomy))
    .filter((value): value is number => value !== null);

  return values.length > 0 ? Math.max(...values) : null;
}

export function recentMpg(entries: FuelEntryLike[]) {
  const latest = entries.find((entry) => decimalToNumber(entry.calculatedEconomy) !== null);
  return latest ? decimalToNumber(latest.calculatedEconomy) : null;
}

export function averageFuelPrice(entries: FuelEntryLike[]) {
  const values = entries.map((entry) => decimalToNumber(entry.pricePerUnit)).filter((value): value is number => value !== null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function totalGallons(entries: FuelEntryLike[]) {
  const values = entries.map((entry) => decimalToNumber(entry.volume)).filter((value): value is number => value !== null);
  return values.reduce((sum, value) => sum + value, 0);
}

export function totalFuelCost(entries: FuelEntryLike[]) {
  return entries.reduce((sum, entry) => sum + entry.totalCostCents, BigInt(0));
}

export function costPerMile(entries: FuelEntryLike[]) {
  const totalCost = Number(totalFuelCost(entries)) / 100;
  const totalDistance = entries.reduce((sum, entry) => sum + (entry.calculatedDistance ?? 0), 0);

  if (totalDistance <= 0) {
    return null;
  }

  return totalCost / totalDistance;
}

export function getFuelSpendThisMonth(entries: FuelEntryLike[], monthStart: Date) {
  return entries.reduce((sum, entry) => {
    if (entry.occurredAt >= monthStart) {
      return sum + entry.totalCostCents;
    }

    return sum;
  }, BigInt(0));
}

export function getServiceSpendThisYear(records: MaintenanceRecordLike[], yearStart: Date) {
  return records.reduce((sum, record) => {
    if (record.occurredAt >= yearStart) {
      return sum + record.totalCostCents;
    }

    return sum;
  }, BigInt(0));
}

export function getReminderSummary(reminder: ReminderLike, currentMileage: number | null) {
  if (reminder.intervalDistance && currentMileage !== null && reminder.lastCompletedOdometer !== null) {
    const milesUsed = currentMileage - reminder.lastCompletedOdometer;
    const milesRemaining = reminder.intervalDistance - milesUsed;

    if (milesRemaining < 0) {
      return {
        label: `${Math.abs(milesRemaining).toLocaleString()} mi overdue`,
        overdue: true,
      };
    }

    return {
      label: `${milesRemaining.toLocaleString()} mi remaining`,
      overdue: false,
    };
  }

  if (reminder.intervalMonths && reminder.lastCompletedAt) {
    const nextDate = new Date(reminder.lastCompletedAt);
    nextDate.setMonth(nextDate.getMonth() + reminder.intervalMonths);

    return {
      label: `Due ${nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      overdue: reminder.status === "OVERDUE",
    };
  }

  return {
    label: reminder.status.replaceAll("_", " "),
    overdue: reminder.status === "OVERDUE",
  };
}

export function ownershipCosts(
  fuelEntries: FuelEntryLike[],
  maintenanceRecords: MaintenanceRecordLike[],
  expenses: ExpenseLike[],
) {
  const fuel = totalFuelCost(fuelEntries);
  const service = maintenanceRecords.reduce((sum, record) => sum + record.totalCostCents, BigInt(0));
  const upgrades = expenses
    .filter((expense) => expense.category === ExpenseCategory.ACCESSORY)
    .reduce((sum, expense) => sum + expense.amountCents, BigInt(0));
  const other = expenses
    .filter((expense) => expense.category !== ExpenseCategory.ACCESSORY)
    .reduce((sum, expense) => sum + expense.amountCents, BigInt(0));

  return {
    fuel,
    service,
    upgrades,
    other,
    total: fuel + service + upgrades + other,
  };
}

export function filterFuelEntriesByMonths(entries: FuelEntryLike[], months: number | null) {
  if (months === null) {
    return entries;
  }

  const start = new Date();
  start.setMonth(start.getMonth() - months);

  return entries.filter((entry) => entry.occurredAt >= start);
}

export function bestTripMiles(entries: FuelEntryLike[]) {
  if (entries.length < 2) {
    return null;
  }

  const ascendingByDate = [...entries].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  let best: number | null = null;

  for (let index = 1; index < ascendingByDate.length; index += 1) {
    const current = ascendingByDate[index];
    const previous = ascendingByDate[index - 1];
    const delta = current.odometer - previous.odometer;

    if (delta <= 0) {
      continue;
    }

    if (best === null || delta > best) {
      best = delta;
    }
  }

  return best;
}
