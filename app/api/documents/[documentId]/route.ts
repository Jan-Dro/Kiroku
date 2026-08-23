import { basename, extname } from "node:path";
import { readFile } from "node:fs/promises";
import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

function buildFilename(title: string, filePath: string) {
  const extension = extname(filePath);
  const normalizedTitle = title.trim().replace(/[<>:"/\\|?*\x00-\x1f]+/g, "-");

  if (!normalizedTitle) {
    return basename(filePath);
  }

  return normalizedTitle.endsWith(extension) ? normalizedTitle : `${normalizedTitle}${extension}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await getSessionUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { documentId } = await params;
  const document = await db.document.findFirst({
    where: {
      id: documentId,
      vehicle: {
        userId: user.id,
      },
    },
  });

  if (!document) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(document.filePath);
    const download = request.nextUrl.searchParams.get("download") === "1";
    const filename = buildFilename(document.title, document.filePath);

    return new Response(file, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Content-Length": String(file.byteLength),
        "Content-Type": document.contentType || "application/octet-stream",
      },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}
