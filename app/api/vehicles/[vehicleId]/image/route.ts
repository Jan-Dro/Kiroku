import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

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
