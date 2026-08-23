import { notFound } from "next/navigation";
import { VehicleWorkspaceShell } from "@/components/vehicle-workspace-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function VehicleWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ vehicleId: string }>;
}) {
  const user = await requireUser();
  const { vehicleId } = await params;
  const vehicle = await db.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId: user.id,
    },
    select: {
      id: true,
      year: true,
      make: true,
      model: true,
      trim: true,
      nickname: true,
      currentMileage: true,
      imagePath: true,
    },
  });

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[1240px] space-y-8">
      <VehicleWorkspaceShell vehicle={vehicle}>{children}</VehicleWorkspaceShell>
    </div>
  );
}
