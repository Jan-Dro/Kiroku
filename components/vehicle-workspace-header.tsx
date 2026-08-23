import { CarFront } from "lucide-react";
import { VehicleAddRecordDialog } from "@/components/vehicle-add-record-dialog";
import { VehicleDocumentDialog } from "@/components/vehicle-document-dialog";
import { VehicleImageDialog } from "@/components/vehicle-image-dialog";
import { type VehicleWorkspaceAction } from "@/lib/vehicle-workspace";
import { formatNumber } from "@/lib/utils";

export function VehicleWorkspaceHeader({
  vehicle,
  action,
}: {
  vehicle: {
    id: string;
    year: number;
    make: string;
    model: string;
    trim: string | null;
    nickname: string;
    currentMileage: number | null;
    imagePath: string | null;
  };
  action: VehicleWorkspaceAction;
}) {
  return (
    <section className="flex flex-col gap-6 py-2 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-end gap-5">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,rgba(37,99,235,0.14),rgba(15,23,42,0.04)),radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_34%)] text-[var(--foreground)]">
          {vehicle.imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`${vehicle.make} ${vehicle.model}`} className="h-full w-full object-cover" src={`/api/vehicles/${vehicle.id}/image`} />
          ) : (
            <CarFront className="h-10 w-10 opacity-75" />
          )}
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
            {vehicle.year} {vehicle.make}
          </p>
          <h1 className="mt-2 text-5xl font-semibold tracking-tight">{vehicle.model}</h1>
          <p className="mt-2 text-lg text-[var(--muted-foreground)]">{vehicle.trim || vehicle.nickname}</p>
          <p className="mt-5 text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Current mileage</p>
          <p className="mt-1 text-3xl font-semibold">
            {vehicle.currentMileage ? `${formatNumber(vehicle.currentMileage, 0)} mi` : "Not set"}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:items-end lg:pb-2">
        <VehicleImageDialog hasImage={Boolean(vehicle.imagePath)} vehicleId={vehicle.id} />
        {action.type === "document" ? (
          <VehicleDocumentDialog
            triggerLabel={action.label}
            vehicleId={vehicle.id}
            latestMileage={vehicle.currentMileage}
          />
        ) : (
          <VehicleAddRecordDialog
            initialRecordType={action.recordType}
            latestMileage={vehicle.currentMileage}
            triggerLabel={action.label}
            vehicleId={vehicle.id}
          />
        )}
      </div>
    </section>
  );
}
