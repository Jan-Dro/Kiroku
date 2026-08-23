import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getVehicleById } from "@/lib/data/vehicles";
import { formatDate, formatNumber } from "@/lib/utils";

export default async function VehicleNotesPage({
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Notes</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Observations, symptoms, follow-up items, and vehicle-specific notes.
        </p>
      </div>

      <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {vehicle.notesEntries.length > 0 ? (
          vehicle.notesEntries.map((note) => (
            <div className="py-4" key={note.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{note.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {formatDate(note.occurredAt)}
                    {note.odometer ? ` · ${formatNumber(note.odometer, 0)} mi` : ""}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">{note.notes}</p>
            </div>
          ))
        ) : (
          <div className="py-4 text-sm text-[var(--muted-foreground)]">No notes recorded yet.</div>
        )}
      </div>
    </div>
  );
}
