import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getVehicleById } from "@/lib/data/vehicles";
import { getReminderSummary } from "@/lib/vehicle-insights";
import { formatCurrencyFromCents, formatDate } from "@/lib/utils";

export default async function VehicleServicePage({
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

  return (
    <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Service</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Maintenance history, reminders, repairs, and structured measurements.
            </p>
          </div>
          <Link className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]" href="/reminders">
            Global reminders →
          </Link>
        </div>

        <div className="space-y-3 border-y border-[var(--border)] py-4">
          {vehicle.reminders.length > 0 ? (
            vehicle.reminders.map((reminder) => {
              const summary = getReminderSummary(reminder, vehicle.currentMileage);

              return (
                <div className="flex items-start justify-between gap-4" key={reminder.id}>
                  <div>
                    <p className="font-medium">{reminder.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{summary.label}</p>
                  </div>
                  {summary.overdue ? (
                    <span className="rounded-full bg-[rgba(239,68,68,0.12)] px-3 py-1 text-xs font-medium text-[oklch(0.7_0.18_25)]">
                      Overdue
                    </span>
                  ) : null}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">No maintenance reminders yet.</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Maintenance history</h3>
        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {vehicle.maintenanceRecords.length > 0 ? (
            vehicle.maintenanceRecords.map((record) => (
              <div className="py-4" key={record.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{record.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {formatDate(record.occurredAt)} · {record.provider ?? "Service record"}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrencyFromCents(record.totalCostCents)}</p>
                </div>
                {record.notes ? (
                  <details className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/35 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-[var(--foreground)]">View notes</summary>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]">{record.notes}</p>
                  </details>
                ) : null}
                {record.measurements.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {record.measurements.map((measurement) => (
                      <span
                        className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs text-[var(--muted-foreground)]"
                        key={measurement.id}
                      >
                        {measurement.label}: {measurement.decimalValue?.toString() ?? measurement.textValue} {measurement.unit ?? ""}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="py-4 text-sm text-[var(--muted-foreground)]">No maintenance records yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
