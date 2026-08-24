import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { persistVehicleImage, removeStoredVehicleImage } from "@/lib/vehicle-images";

export const runtime = "nodejs";

type ErrorCode = "UNAUTHORIZED" | "UNSUPPORTED_MEDIA_TYPE" | "INVALID_REQUEST" | "VEHICLE_NOT_FOUND" | "UPLOAD_FAILED";

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

function contentTypeFromPath(filePath: string) {
  const extension = extname(filePath).toLowerCase();

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vehicleId: string }> },
) {
  const user = await getSessionUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { vehicleId } = await params;
  const vehicle = await db.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId: user.id,
    },
    select: {
      imagePath: true,
    },
  });

  if (!vehicle?.imagePath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(vehicle.imagePath);

    return new Response(file, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
        "Content-Length": String(file.byteLength),
        "Content-Type": contentTypeFromPath(vehicle.imagePath),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string }> },
) {
  const user = await getSessionUser();

  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const contentType = request.headers.get("content-type") || "";

  if (!contentType.startsWith("multipart/form-data")) {
    return jsonError(415, "UNSUPPORTED_MEDIA_TYPE", "Use multipart/form-data for uploads.");
  }

  const { vehicleId } = await params;
  const formData = await request.formData();
  const bodyVehicleId = formData.get("vehicleId")?.toString().trim();
  const image = formData.get("image");

  if (bodyVehicleId && bodyVehicleId !== vehicleId) {
    return jsonError(400, "INVALID_REQUEST", "Vehicle id does not match upload target.");
  }

  if (!(image instanceof File) || image.size === 0) {
    return jsonError(400, "INVALID_REQUEST", "Choose an image to upload.");
  }

  const vehicle = await db.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId: user.id,
    },
    select: {
      id: true,
      imagePath: true,
    },
  });

  if (!vehicle) {
    return jsonError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
  }

  try {
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

    return Response.json(
      {
        ok: true,
        image: {
          contentType: image.type,
          sizeBytes: image.size,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(400, "INVALID_REQUEST", error.message);
    }

    return jsonError(500, "UPLOAD_FAILED", "Unable to upload vehicle image.");
  }
}
