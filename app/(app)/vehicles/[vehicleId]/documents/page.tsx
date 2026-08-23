import { notFound } from "next/navigation";
import { FileText, FileUp, FolderOpen, ImageIcon } from "lucide-react";
import { DeleteDocumentButton } from "@/components/delete-document-button";
import { VehicleDocumentDialog } from "@/components/vehicle-document-dialog";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getVehicleById } from "@/lib/data/vehicles";
import { formatDate, formatNumber } from "@/lib/utils";

function formatDocumentCategory(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${formatNumber(bytes / 1024, 0)} KB`;
  }

  return `${formatNumber(bytes / (1024 * 1024), 1)} MB`;
}

function getDocumentIcon(contentType: string) {
  if (contentType.startsWith("image/")) {
    return ImageIcon;
  }

  return contentType === "application/pdf" ? FolderOpen : FileText;
}

export default async function VehicleDocumentsPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const user = await requireUser();
  const { vehicleId } = await params;
  const vehicle = await getVehicleById(user.id, vehicleId);

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight">Documents</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Vehicle-specific receipts, service invoices, registration, warranty records, and manuals.
        </p>
      </div>

      {vehicle.documents.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-[var(--border)] bg-[linear-gradient(160deg,color-mix(in_oklab,var(--card)_90%,white)_0%,color-mix(in_oklab,var(--muted)_84%,black)_100%)] p-6 sm:p-8">
          <div className="flex max-w-2xl flex-col gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[var(--muted)]">
              <FileUp className="h-6 w-6 text-[var(--muted-foreground)]" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Keep the paperwork with the vehicle</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                Upload service invoices, registration, warranty details, receipts, and manuals so they stay attached to this vehicle instead of getting buried elsewhere.
              </p>
            </div>
            <div>
              <VehicleDocumentDialog
                latestMileage={vehicle.currentMileage}
                triggerLabel="Upload your first document"
                vehicleId={vehicle.id}
              />
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Document library</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Receipts, invoices, registrations, manuals, and other vehicle paperwork.
              </p>
            </div>
            <VehicleDocumentDialog
              latestMileage={vehicle.currentMileage}
              triggerLabel="Upload another document"
              triggerClassName="w-full sm:w-auto"
              vehicleId={vehicle.id}
            />
          </div>

          <div className="grid gap-4">
            {vehicle.documents.map((document) => {
              const Icon = getDocumentIcon(document.contentType);

              return (
                <article
                  className="rounded-[26px] border border-[var(--border)] bg-[color-mix(in_oklab,var(--card)_92%,white)] p-5"
                  key={document.id}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--muted)]">
                        <Icon className="h-5 w-5 text-[var(--muted-foreground)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold">{document.title}</h3>
                          <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                            {formatDocumentCategory(document.category)}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--muted-foreground)]">
                          <span>{document.occurredAt ? formatDate(document.occurredAt) : "No date"}</span>
                          <span>{formatFileSize(document.fileSizeBytes)}</span>
                          <span>{document.contentType.replace("application/", "").replace("image/", "").toUpperCase()}</span>
                          {document.odometer !== null ? <span>{formatNumber(document.odometer, 0)} mi</span> : null}
                        </div>
                        {document.notes ? (
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">{document.notes}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <a href={`/api/documents/${document.id}`} rel="noreferrer" target="_blank">
                          View
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <a href={`/api/documents/${document.id}?download=1`}>Download</a>
                      </Button>
                      <VehicleDocumentDialog
                        document={{
                          id: document.id,
                          title: document.title,
                          category: document.category,
                          occurredAt: document.occurredAt ? document.occurredAt.toISOString() : null,
                          odometer: document.odometer,
                          notes: document.notes,
                        }}
                        latestMileage={vehicle.currentMileage}
                        mode="edit"
                        triggerSize="sm"
                        triggerLabel="Edit"
                        triggerVariant="ghost"
                        vehicleId={vehicle.id}
                      />
                      <DeleteDocumentButton documentId={document.id} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
