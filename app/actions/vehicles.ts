"use server";
import { revalidatePath } from "next/cache";
import { DocumentCategory, ExpenseCategory, FuelType } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateFuelEconomy } from "@/lib/domain/fuel";
import { shouldPromoteCurrentMileage } from "@/lib/domain/odometer";
import { parseCurrencyToCents } from "@/lib/domain/money";
import { removeStoredDocument } from "@/lib/documents";
import { ensureAllowedVehicleImage, persistVehicleImage, removeStoredVehicleImage } from "@/lib/vehicle-images";
import { vehicleSchema } from "@/lib/validators/vehicle";

type VehicleActionState = {
  ok: boolean;
  error: string;
  vehicleId: string;
};

type VehicleRecordActionState = {
  ok: boolean;
  error: string;
};

type VehicleDocumentActionState = {
  ok: boolean;
  error: string;
};

type VehicleImageActionState = {
  ok: boolean;
  error: string;
};

function optionalNumber(value: FormDataEntryValue | null) {
  if (value === null || value === "") {
    return undefined;
  }

  return Number(value);
}

function optionalString(value: FormDataEntryValue | null) {
  if (value === null) {
    return null;
  }

  const trimmed = value.toString().trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function assertVehicleOwnership(userId: string, vehicleId: string) {
  const vehicle = await db.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId,
    },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  return vehicle;
}

async function updateVehicleMileageIfNeeded(vehicleId: string, nextMileage: number) {
  const latestReading = await db.odometerReading.findFirst({
    where: { vehicleId },
    orderBy: { reading: "desc" },
  });

  await db.odometerReading.create({
    data: {
      vehicleId,
      occurredAt: new Date(),
      reading: nextMileage,
      source: "manual-entry",
    },
  });

  if (shouldPromoteCurrentMileage(latestReading?.reading ?? null, nextMileage)) {
    await db.vehicle.update({
      where: { id: vehicleId },
      data: {
        currentMileage: nextMileage,
      },
    });
  }
}

export async function createVehicleAction(
  _previousState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  const user = await requireUser();
  const image = formData.get("image");
  const parsed = vehicleSchema.safeParse({
    nickname: formData.get("nickname"),
    year: formData.get("year"),
    make: formData.get("make"),
    model: formData.get("model"),
    trim: formData.get("trim"),
    vin: formData.get("vin"),
    licensePlate: formData.get("licensePlate"),
    purchaseDate: formData.get("purchaseDate"),
    purchaseMileage: optionalNumber(formData.get("purchaseMileage")),
    currentMileage: optionalNumber(formData.get("currentMileage")),
    purchasePrice: formData.get("purchasePrice"),
    engine: formData.get("engine"),
    drivetrain: formData.get("drivetrain"),
    transmission: formData.get("transmission"),
    fuelType:
      formData.get("fuelType") && formData.get("fuelType") !== ""
        ? (formData.get("fuelType") as FuelType)
        : null,
    exteriorColor: formData.get("exteriorColor"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid vehicle data.",
      vehicleId: "",
    };
  }

  if (image instanceof File && image.size > 0) {
    // Note: image validation is intentionally not performed here for createVehicleAction
    // because the binary must not be submitted via Server Actions (it hits Next's body limit).
    // The client will upload the image separately to the dedicated API route after the
    // vehicle is created.
  }

  const purchasePriceCents =
    parsed.data.purchasePrice && parsed.data.purchasePrice.length > 0
      ? parseCurrencyToCents(parsed.data.purchasePrice)
      : null;

  const vehicle = await db.vehicle.create({
    data: {
      userId: user.id,
      nickname: parsed.data.nickname,
      year: parsed.data.year,
      make: parsed.data.make,
      model: parsed.data.model,
      trim: parsed.data.trim || null,
      vin: parsed.data.vin || null,
      licensePlate: parsed.data.licensePlate || null,
      purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : null,
      purchaseMileage: parsed.data.purchaseMileage ?? null,
      currentMileage: parsed.data.currentMileage ?? parsed.data.purchaseMileage ?? null,
      purchasePriceCents,
      engine: parsed.data.engine || null,
      drivetrain: parsed.data.drivetrain || null,
      transmission: parsed.data.transmission || null,
      fuelType: parsed.data.fuelType || null,
      exteriorColor: parsed.data.exteriorColor || null,
      notes: parsed.data.notes || null,
    },
  });

  if (vehicle.currentMileage !== null) {
    await db.odometerReading.create({
      data: {
        vehicleId: vehicle.id,
        occurredAt: new Date(),
        reading: vehicle.currentMileage,
        source: "vehicle-create",
      },
    });
  }

  // Image persistence is performed by the client via the /api/vehicles/{vehicleId}/image
  // endpoint using fetch + FormData, to avoid sending binary data through Server Actions.

  revalidatePath("/dashboard");
  revalidatePath("/vehicles");

  return { ok: true, error: "", vehicleId: vehicle.id };
}

export async function updateVehicleImageAction(
  _previousState: VehicleImageActionState,
  formData: FormData,
): Promise<VehicleImageActionState> {
  try {
    const user = await requireUser();
    const vehicleId = formData.get("vehicleId")?.toString() ?? "";
    const image = formData.get("image");
    const vehicle = await assertVehicleOwnership(user.id, vehicleId);

    if (!(image instanceof File) || image.size === 0) {
      return { ok: false, error: "Choose an image to upload." };
    }

    const storedImage = await persistVehicleImage(vehicleId, image);

    await db.vehicle.update({
      where: { id: vehicleId },
      data: {
        imagePath: storedImage.diskPath,
      },
    });

    await removeStoredVehicleImage(vehicle.imagePath);
    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath("/dashboard");
    revalidatePath("/vehicles");

    return { ok: true, error: "" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to update vehicle image." };
  }
}

export async function createFuelEntryAction(
  _previousState: VehicleRecordActionState,
  formData: FormData,
): Promise<VehicleRecordActionState> {
  try {
    const user = await requireUser();
    const vehicleId = formData.get("vehicleId")?.toString() ?? "";
    const vehicle = await assertVehicleOwnership(user.id, vehicleId);
    const odometer = Number(formData.get("odometer"));
    const volume = Number(formData.get("volume"));
    const pricePerUnit = Number(formData.get("pricePerUnit"));
    const occurredAtRaw = formData.get("occurredAt")?.toString();
    const station = optionalString(formData.get("station"));
    const notes = optionalString(formData.get("notes"));
    const isFullTank = formData.get("isFullTank") === "on";

    if (!occurredAtRaw || Number.isNaN(odometer) || Number.isNaN(volume) || Number.isNaN(pricePerUnit)) {
      return { ok: false, error: "Fill out the date, odometer, gallons, and price." };
    }

    const previousFull = await db.fuelEntry.findFirst({
      where: {
        vehicleId,
        isFullTank: true,
      },
      orderBy: { odometer: "desc" },
    });

    const fuelStats = calculateFuelEconomy({
      previousFullOdometer: previousFull?.odometer ?? null,
      currentOdometer: odometer,
      currentVolume: volume,
      currentIsFullTank: isFullTank,
    });

    const totalCostCents = BigInt(Math.round(volume * pricePerUnit * 100));

    const entry = await db.fuelEntry.create({
      data: {
        vehicleId,
        occurredAt: new Date(occurredAtRaw),
        odometer,
        volume: volume.toFixed(3),
        pricePerUnit: pricePerUnit.toFixed(3),
        totalCostCents,
        station,
        notes,
        isFullTank,
        calculatedDistance: fuelStats.distance,
        calculatedEconomy: fuelStats.mpg?.toFixed(3),
      },
    });

    await db.timelineEvent.create({
      data: {
        vehicleId,
        type: "FUEL",
        occurredAt: entry.occurredAt,
        fuelEntryId: entry.id,
      },
    });

    await updateVehicleMileageIfNeeded(vehicle.id, odometer);
    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath("/dashboard");

    return { ok: true, error: "" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to add fuel entry." };
  }
}

export async function createMaintenanceRecordAction(
  _previousState: VehicleRecordActionState,
  formData: FormData,
): Promise<VehicleRecordActionState> {
  try {
    const user = await requireUser();
    const vehicleId = formData.get("vehicleId")?.toString() ?? "";
    const vehicle = await assertVehicleOwnership(user.id, vehicleId);
    const title = formData.get("title")?.toString().trim() ?? "";
    const occurredAtRaw = formData.get("occurredAt")?.toString();
    const odometer = Number(formData.get("odometer"));
    const totalCostInput = formData.get("totalCost")?.toString() ?? "";
    const provider = optionalString(formData.get("provider"));
    const notes = optionalString(formData.get("notes"));

    if (!title || !occurredAtRaw || Number.isNaN(odometer)) {
      return { ok: false, error: "Fill out the service title, date, and odometer." };
    }

    const totalCostCents = totalCostInput ? parseCurrencyToCents(totalCostInput) : BigInt(0);

    const record = await db.maintenanceRecord.create({
      data: {
        vehicleId,
        occurredAt: new Date(occurredAtRaw),
        odometer,
        title,
        provider,
        notes,
        totalCostCents,
      },
    });

    await db.timelineEvent.create({
      data: {
        vehicleId,
        type: "MAINTENANCE",
        occurredAt: record.occurredAt,
        maintenanceRecordId: record.id,
      },
    });

    await updateVehicleMileageIfNeeded(vehicle.id, odometer);
    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath("/dashboard");

    return { ok: true, error: "" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to add maintenance record." };
  }
}

export async function createExpenseAction(
  _previousState: VehicleRecordActionState,
  formData: FormData,
): Promise<VehicleRecordActionState> {
  try {
    const user = await requireUser();
    const vehicleId = formData.get("vehicleId")?.toString() ?? "";
    await assertVehicleOwnership(user.id, vehicleId);
    const occurredAtRaw = formData.get("occurredAt")?.toString();
    const amount = formData.get("amount")?.toString() ?? "";
    const merchant = optionalString(formData.get("merchant"));
    const notes = optionalString(formData.get("notes"));
    const categoryValue = formData.get("category")?.toString() ?? "OTHER";
    const category = ExpenseCategory[categoryValue as keyof typeof ExpenseCategory] ?? ExpenseCategory.OTHER;
    const odometerRaw = formData.get("odometer")?.toString();

    if (!occurredAtRaw || !amount) {
      return { ok: false, error: "Fill out the date and amount." };
    }

    const expense = await db.expense.create({
      data: {
        vehicleId,
        occurredAt: new Date(occurredAtRaw),
        amountCents: parseCurrencyToCents(amount),
        merchant,
        notes,
        category,
        odometer: odometerRaw ? Number(odometerRaw) : null,
      },
    });

    if (odometerRaw) {
      await updateVehicleMileageIfNeeded(vehicleId, Number(odometerRaw));
    }

    await db.timelineEvent.create({
      data: {
        vehicleId,
        type: "EXPENSE",
        occurredAt: expense.occurredAt,
        expenseId: expense.id,
      },
    });

    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath("/dashboard");
    return { ok: true, error: "" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to add expense." };
  }
}

export async function updateVehicleDocumentMetadataAction(
  _previousState: VehicleDocumentActionState,
  formData: FormData,
): Promise<VehicleDocumentActionState> {
  try {
    const user = await requireUser();
    const documentId = formData.get("documentId")?.toString() ?? "";
    const title = formData.get("title")?.toString().trim() ?? "";
    const occurredAtRaw = formData.get("occurredAt")?.toString() ?? "";
    const categoryValue = formData.get("category")?.toString() ?? "OTHER";
    const notes = optionalString(formData.get("notes"));
    const odometerRaw = formData.get("odometer")?.toString();

    const document = await db.document.findFirst({
      where: {
        id: documentId,
        vehicle: {
          userId: user.id,
        },
      },
    });

    if (!document) {
      return { ok: false, error: "Document not found." };
    }

    await db.document.update({
      where: { id: document.id },
      data: {
        title,
        occurredAt: occurredAtRaw ? new Date(occurredAtRaw) : null,
        category: DocumentCategory[categoryValue as keyof typeof DocumentCategory] ?? DocumentCategory.OTHER,
        notes,
        odometer: odometerRaw ? Number(odometerRaw) : null,
      },
    });

    if (odometerRaw) {
      await updateVehicleMileageIfNeeded(document.vehicleId, Number(odometerRaw));
    }

    revalidatePath(`/vehicles/${document.vehicleId}/documents`);
    revalidatePath(`/vehicles/${document.vehicleId}`);
    revalidatePath("/dashboard");
    return { ok: true, error: "" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to update document." };
  }
}

export async function deleteVehicleDocumentAction(formData: FormData) {
  const user = await requireUser();
  const documentId = formData.get("documentId")?.toString() ?? "";
  const document = await db.document.findFirst({
    where: {
      id: documentId,
      vehicle: {
        userId: user.id,
      },
    },
  });

  if (!document) {
    return;
  }

  await db.timelineEvent.deleteMany({
    where: { documentId: document.id },
  });
  await db.document.delete({
    where: { id: document.id },
  });
  await removeStoredDocument(document.filePath);
  revalidatePath(`/vehicles/${document.vehicleId}/documents`);
  revalidatePath(`/vehicles/${document.vehicleId}`);
  revalidatePath("/dashboard");
}

export async function createVehicleNoteAction(
  _previousState: VehicleRecordActionState,
  formData: FormData,
): Promise<VehicleRecordActionState> {
  try {
    const user = await requireUser();
    const vehicleId = formData.get("vehicleId")?.toString() ?? "";
    const vehicle = await assertVehicleOwnership(user.id, vehicleId);
    const title = formData.get("title")?.toString().trim() ?? "";
    const notes = formData.get("notes")?.toString().trim() ?? "";
    const occurredAtRaw = formData.get("occurredAt")?.toString();
    const odometerRaw = formData.get("odometer")?.toString();

    if (!title || !notes || !occurredAtRaw) {
      return { ok: false, error: "Fill out the note title, note body, and date." };
    }

    const vehicleNote = await db.vehicleNote.create({
      data: {
        vehicleId,
        occurredAt: new Date(occurredAtRaw),
        odometer: odometerRaw ? Number(odometerRaw) : null,
        title,
        notes,
        tags: [],
      },
    });

    await db.timelineEvent.create({
      data: {
        vehicleId,
        type: "NOTE",
        occurredAt: vehicleNote.occurredAt,
        vehicleNoteId: vehicleNote.id,
      },
    });

    if (odometerRaw) {
      await updateVehicleMileageIfNeeded(vehicle.id, Number(odometerRaw));
    }

    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath("/dashboard");
    return { ok: true, error: "" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to add note." };
  }
}
