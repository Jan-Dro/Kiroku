"use client";

import { usePathname } from "next/navigation";
import { VehicleWorkspaceHeader } from "@/components/vehicle-workspace-header";
import { VehicleWorkspaceNav } from "@/components/vehicle-workspace-nav";
import { getVehicleWorkspaceAction, getVehicleWorkspaceSection } from "@/lib/vehicle-workspace";

export function VehicleWorkspaceShell({
  children,
  vehicle,
}: {
  children: React.ReactNode;
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
}) {
  const pathname = usePathname();
  const section = getVehicleWorkspaceSection(pathname, vehicle.id);
  const action = getVehicleWorkspaceAction(section);

  return (
    <>
      <VehicleWorkspaceHeader action={action} vehicle={vehicle} />
      <VehicleWorkspaceNav section={section} vehicleId={vehicle.id} />
      <div className="pt-2">{children}</div>
    </>
  );
}
