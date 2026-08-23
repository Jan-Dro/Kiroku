import {
  ExpenseCategory,
  FuelType,
  MaintenanceCategory,
  TimelineEventType,
  PrismaClient,
} from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  await prisma.timelineEvent.deleteMany();
  await prisma.document.deleteMany();
  await prisma.vehicleNote.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.maintenanceMeasurement.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.maintenanceType.deleteMany();
  await prisma.fuelEntry.deleteMany();
  await prisma.odometerReading.deleteMany();
  await prisma.importSession.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await argon2.hash("demo-password");

  const user = await prisma.user.create({
    data: {
      email: "demo@example.com",
      username: "demo",
      displayName: "Demo Driver",
      passwordHash,
      preferences: {
        create: {},
      },
      maintenanceTypes: {
        create: [
          { name: "Oil Change", category: MaintenanceCategory.OIL_CHANGE },
          { name: "Brake Inspection", category: MaintenanceCategory.BRAKES },
          { name: "Tire Rotation", category: MaintenanceCategory.TIRE_ROTATION }
        ],
      },
    },
    include: {
      maintenanceTypes: true,
    },
  });

  const truck = await prisma.vehicle.create({
    data: {
      userId: user.id,
      nickname: "Tundra",
      year: 2024,
      make: "Toyota",
      model: "Tundra",
      trim: "SR5",
      vin: "5TFJA5DB2RX123456",
      licensePlate: "TXD-2024",
      purchaseDate: new Date("2024-06-15T00:00:00.000Z"),
      purchaseMileage: 12,
      currentMileage: 14620,
      purchasePriceCents: BigInt(5480000),
      engine: "3.4L V6",
      drivetrain: "4WD",
      transmission: "10-speed automatic",
      fuelType: FuelType.GASOLINE,
      exteriorColor: "Lunar Rock",
      notes: "Primary road trip vehicle.",
    },
  });

  const commuter = await prisma.vehicle.create({
    data: {
      userId: user.id,
      nickname: "Commuter",
      year: 2022,
      make: "Honda",
      model: "Civic",
      trim: "Sport Touring",
      currentMileage: 28110,
      purchaseMileage: 8,
      purchaseDate: new Date("2022-03-02T00:00:00.000Z"),
      purchasePriceCents: BigInt(3125000),
      fuelType: FuelType.GASOLINE,
      notes: "Daily driver with strong fuel economy.",
    },
  });

  const oilChangeType = user.maintenanceTypes.find((type) => type.name === "Oil Change");
  const brakeType = user.maintenanceTypes.find((type) => type.name === "Brake Inspection");

  const fuel1 = await prisma.fuelEntry.create({
    data: {
      vehicleId: truck.id,
      occurredAt: new Date("2026-07-02T12:15:00.000Z"),
      odometer: 13980,
      volume: "18.241",
      pricePerUnit: "3.459",
      totalCostCents: BigInt(6310),
      station: "Buc-ee's",
      fuelGrade: "87",
      isFullTank: true,
    },
  });

  const fuel2 = await prisma.fuelEntry.create({
    data: {
      vehicleId: truck.id,
      occurredAt: new Date("2026-07-19T08:22:00.000Z"),
      odometer: 14345,
      volume: "17.882",
      pricePerUnit: "3.619",
      totalCostCents: BigInt(6471),
      station: "Shell",
      fuelGrade: "87",
      isFullTank: true,
      calculatedDistance: 365,
      calculatedEconomy: "20.412",
    },
  });

  const service = await prisma.maintenanceRecord.create({
    data: {
      vehicleId: truck.id,
      maintenanceTypeId: oilChangeType?.id,
      occurredAt: new Date("2026-08-05T14:00:00.000Z"),
      odometer: 14512,
      title: "Synthetic oil service",
      description: "Oil and filter replacement.",
      provider: "Northside Toyota",
      laborCostCents: BigInt(2500),
      partsCostCents: BigInt(4200),
      feesCostCents: BigInt(480),
      totalCostCents: BigInt(7180),
      notes: "Used 0W-20 full synthetic.",
    },
  });

  await prisma.maintenanceMeasurement.createMany({
    data: [
      {
        maintenanceRecordId: service.id,
        label: "Oil Life",
        unit: "%",
        decimalValue: "100.000",
      },
      {
        maintenanceRecordId: service.id,
        label: "Next Change",
        unit: "mi",
        decimalValue: "19512.000",
      },
    ],
  });

  const brakeInspection = await prisma.maintenanceRecord.create({
    data: {
      vehicleId: commuter.id,
      maintenanceTypeId: brakeType?.id,
      occurredAt: new Date("2026-08-10T17:45:00.000Z"),
      odometer: 28021,
      title: "Brake inspection",
      provider: "Neighborhood Auto",
      laborCostCents: BigInt(0),
      partsCostCents: BigInt(0),
      feesCostCents: BigInt(0),
      totalCostCents: BigInt(0),
      notes: "Rear pads wearing slightly faster than front.",
    },
  });

  await prisma.maintenanceMeasurement.createMany({
    data: [
      {
        maintenanceRecordId: brakeInspection.id,
        label: "Front Pads",
        positionLabel: "Front",
        unit: "mm",
        decimalValue: "8.000",
      },
      {
        maintenanceRecordId: brakeInspection.id,
        label: "Rear Pads",
        positionLabel: "Rear",
        unit: "mm",
        decimalValue: "6.000",
      },
    ],
  });

  await prisma.reminder.create({
    data: {
      userId: user.id,
      vehicleId: truck.id,
      maintenanceTypeId: oilChangeType?.id,
      title: "Oil change",
      intervalDistance: 5000,
      intervalMonths: 6,
      warnDistanceBefore: 500,
      warnDaysBefore: 21,
      lastCompletedAt: service.occurredAt,
      lastCompletedOdometer: service.odometer,
    },
  });

  await prisma.expense.create({
    data: {
      vehicleId: truck.id,
      occurredAt: new Date("2026-08-12T10:30:00.000Z"),
      amountCents: BigInt(12900),
      merchant: "WeatherTech",
      category: ExpenseCategory.ACCESSORY,
      notes: "Bed mat",
    },
  });

  await prisma.vehicleNote.create({
    data: {
      vehicleId: commuter.id,
      occurredAt: new Date("2026-08-14T18:00:00.000Z"),
      odometer: 28102,
      title: "Highway vibration",
      notes: "Slight vibration begins around 70 MPH on rough pavement.",
      tags: ["tires", "alignment"],
      linkedMaintenanceRecordId: brakeInspection.id,
    },
  });

  await prisma.odometerReading.create({
    data: {
      vehicleId: truck.id,
      occurredAt: new Date("2026-08-20T07:00:00.000Z"),
      reading: 14620,
      source: "manual",
    },
  });

  await prisma.timelineEvent.createMany({
    data: [
      { vehicleId: truck.id, type: TimelineEventType.FUEL, occurredAt: fuel1.occurredAt, fuelEntryId: fuel1.id },
      { vehicleId: truck.id, type: TimelineEventType.FUEL, occurredAt: fuel2.occurredAt, fuelEntryId: fuel2.id },
      {
        vehicleId: truck.id,
        type: TimelineEventType.MAINTENANCE,
        occurredAt: service.occurredAt,
        maintenanceRecordId: service.id,
      },
      {
        vehicleId: commuter.id,
        type: TimelineEventType.MAINTENANCE,
        occurredAt: brakeInspection.occurredAt,
        maintenanceRecordId: brakeInspection.id,
      }
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
