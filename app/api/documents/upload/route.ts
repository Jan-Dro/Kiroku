import { revalidatePath } from "next/cache";
import { DocumentCategory } from "@prisma/client";
import { shouldPromoteCurrentMileage } from "@/lib/domain/odometer";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  DocumentUploadValidationError,
  persistVehicleDocument,
  removeStoredDocument,
} from "@/lib/documents";

export const runtime = "nodejs";

type ErrorCode =
  | "UNAUTHORIZED"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "INVALID_REQUEST"
  | "VEHICLE_NOT_FOUND"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "UPLOAD_FAILED";

function jsonError(status: number, code: ErrorCode, message: string) {
  return Response.json(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

function optionalString(value: FormDataEntryValue | null) {
  if (value === null) {
    return null;
  }

  const trimmed = value.toString().trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalOdometer(value: FormDataEntryValue | null) {
  if (value === null || value.toString().trim() === "") {
    return null;
  }

  const odometer = Number(value);
  return Number.isInteger(odometer) && odometer >= 0 ? odometer : Number.NaN;
}

function parseOccurredAt(value: FormDataEntryValue | null) {
  const rawValue = value?.toString().trim() ?? "";

  if (!rawValue) {
    return null;
  }

  const occurredAt = new Date(rawValue);
  return Number.isNaN(occurredAt.getTime()) ? null : occurredAt;
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const contentType = request.headers.get("content-type") || "";

  if (!contentType.startsWith("multipart/form-data")) {
    return jsonError(415, "UNSUPPORTED_MEDIA_TYPE", "Use multipart/form-data for uploads.");
  }

  const formData = await request.formData();
  const vehicleId = formData.get("vehicleId")?.toString().trim() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const categoryValue = formData.get("category")?.toString().trim() ?? "OTHER";
  const notes = optionalString(formData.get("notes"));
  const odometer = parseOptionalOdometer(formData.get("odometer"));
  const occurredAt = parseOccurredAt(formData.get("occurredAt"));
  const file = formData.get("file");

  if (!vehicleId || !title || !occurredAt) {
    return jsonError(400, "INVALID_REQUEST", "Fill out the title, date, and vehicle.");
  }

  if (Number.isNaN(odometer)) {
    return jsonError(400, "INVALID_REQUEST", "Enter a valid odometer reading.");
  }

  if (!(file instanceof File) || file.size === 0) {
    return jsonError(400, "INVALID_REQUEST", "Choose a file to upload.");
  }

  const category = DocumentCategory[categoryValue as keyof typeof DocumentCategory];

  if (!category) {
    return jsonError(400, "INVALID_REQUEST", "Choose a valid document category.");
  }

  const vehicle = await db.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!vehicle) {
    return jsonError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
  }

  let storedDocument: Awaited<ReturnType<typeof persistVehicleDocument>> | null = null;

  try {
    storedDocument = await persistVehicleDocument(vehicle.id, file);
    const storedPath = storedDocument.diskPath;

    const document = await db.$transaction(async (tx) => {
      const createdDocument = await tx.document.create({
        data: {
          vehicleId: vehicle.id,
          title,
          category,
          filePath: storedPath,
          contentType: file.type,
          fileSizeBytes: file.size,
          occurredAt,
          odometer,
          notes,
        },
      });

      await tx.timelineEvent.create({
        data: {
          vehicleId: vehicle.id,
          type: "DOCUMENT",
          occurredAt: createdDocument.occurredAt ?? new Date(),
          documentId: createdDocument.id,
        },
      });

      if (odometer !== null) {
        const latestReading = await tx.odometerReading.findFirst({
          where: { vehicleId: vehicle.id },
          orderBy: { reading: "desc" },
        });

        await tx.odometerReading.create({
          data: {
            vehicleId: vehicle.id,
            occurredAt: new Date(),
            reading: odometer,
            source: "manual-entry",
          },
        });

        if (shouldPromoteCurrentMileage(latestReading?.reading ?? null, odometer)) {
          await tx.vehicle.update({
            where: { id: vehicle.id },
            data: {
              currentMileage: odometer,
            },
          });
        }
      }

      return createdDocument;
    });

    revalidatePath(`/vehicles/${vehicle.id}/documents`);
    revalidatePath(`/vehicles/${vehicle.id}`);
    revalidatePath("/dashboard");

    return Response.json(
      {
        ok: true,
        document: {
          id: document.id,
          title: document.title,
          category: document.category,
          contentType: document.contentType,
          fileSizeBytes: document.fileSizeBytes,
          occurredAt: document.occurredAt?.toISOString() ?? null,
          odometer: document.odometer,
          notes: document.notes,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (storedDocument) {
      await removeStoredDocument(storedDocument.diskPath);
    }

    if (error instanceof DocumentUploadValidationError) {
      return jsonError(400, error.code, error.message);
    }

    console.error("Unable to upload document.", error);
    return jsonError(500, "UPLOAD_FAILED", "Unable to upload document.");
  }
}
