import { db } from "@/lib/db";

export async function getVehiclesForUser(userId: string) {
  return db.vehicle.findMany({
    where: { userId },
    orderBy: [{ createdAt: "asc" }],
    include: {
      fuelEntries: {
        orderBy: { occurredAt: "desc" },
        take: 1,
      },
      maintenanceRecords: {
        orderBy: { occurredAt: "desc" },
        take: 1,
      },
      reminders: {
        where: { isActive: true },
        take: 2,
      },
    },
  });
}

export async function getVehicleById(userId: string, vehicleId: string) {
  return db.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId,
    },
    include: {
      fuelEntries: {
        orderBy: { occurredAt: "desc" },
        take: 12,
      },
      maintenanceRecords: {
        orderBy: { occurredAt: "desc" },
        take: 10,
        include: {
          measurements: true,
          maintenanceType: true,
        },
      },
      expenses: {
        orderBy: { occurredAt: "desc" },
        take: 10,
      },
      documents: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      notesEntries: {
        orderBy: { occurredAt: "desc" },
        take: 10,
      },
      reminders: {
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
      },
      timelineEvents: {
        orderBy: { occurredAt: "desc" },
        take: 20,
        include: {
          fuelEntry: true,
          maintenanceRecord: true,
          expense: true,
          vehicleNote: true,
          document: true,
          odometerReading: true,
        },
      },
    },
  });
}
