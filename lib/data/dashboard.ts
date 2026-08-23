import { db } from "@/lib/db";

export async function getDashboardData(userId: string) {
  const vehicles = await db.vehicle.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      fuelEntries: {
        orderBy: { occurredAt: "desc" },
        take: 8,
      },
      maintenanceRecords: {
        orderBy: { occurredAt: "desc" },
        take: 5,
      },
      reminders: {
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 3,
      },
    },
  });

  const recentTimeline = await db.timelineEvent.findMany({
    where: {
      vehicle: {
        userId,
      },
    },
    orderBy: { occurredAt: "desc" },
    take: 10,
    include: {
      vehicle: true,
      fuelEntry: true,
      maintenanceRecord: true,
      expense: true,
      vehicleNote: true,
      document: true,
      odometerReading: true,
    },
  });

  return {
    vehicles,
    recentTimeline,
  };
}
