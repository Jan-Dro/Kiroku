"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FileUp, Pencil, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateVehicleDocumentMetadataAction } from "@/app/actions/vehicles";
import { getLocalDateInputValue } from "@/lib/client-date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState = {
  ok: false,
  error: "",
};

const categories = [
  ["SERVICE_INVOICE", "Service Invoice"],
  ["RECEIPT", "Receipt"],
  ["REGISTRATION", "Registration"],
  ["INSPECTION", "Inspection"],
  ["INSURANCE", "Insurance"],
  ["WARRANTY", "Warranty"],
  ["PURCHASE", "Purchase Document"],
  ["MANUAL", "Manual"],
  ["OTHER", "Other"],
] as const;

function titleFromFilename(filename: string) {
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export function VehicleDocumentDialog({
  vehicleId,
  latestMileage,
  triggerLabel = "Upload document",
  mode = "create",
  document,
  triggerSize = "lg",
  triggerVariant,
  triggerClassName,
}: {
  vehicleId: string;
  latestMileage: number | null;
  triggerLabel?: string;
  mode?: "create" | "edit";
  document?: {
    id: string;
    title: string;
    category: string;
    occurredAt: string | null;
    odometer: number | null;
    notes: string | null;
  };
  triggerSize?: "default" | "sm" | "lg" | "icon";
  triggerVariant?: "default" | "secondary" | "outline" | "ghost";
  triggerClassName?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [localDate, setLocalDate] = useState(getLocalDateInputValue());
  const [selectedFilename, setSelectedFilename] = useState("");
  const [title, setTitle] = useState(document?.title ?? "");
  const [createState, setCreateState] = useState(initialState);
  const [createPending, setCreatePending] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(updateVehicleDocumentMetadataAction, initialState);

  useEffect(() => {
    setLocalDate(getLocalDateInputValue());
  }, []);

  useEffect(() => {
    if (open) {
      setTitle(document?.title ?? "");
      setSelectedFilename("");
      setCreateState(initialState);
    }
  }, [document?.title, open]);

  useEffect(() => {
    if (updateState.ok) {
      setOpen(false);
    }
  }, [updateState.ok]);

  const pending = mode === "create" ? createPending : updatePending;
  const error = mode === "create" ? createState.error : updateState.error;
  const defaultDate = useMemo(
    () => document?.occurredAt?.slice(0, 10) ?? localDate,
    [document?.occurredAt, localDate],
  );

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (createPending) {
      return;
    }

    const form = event.currentTarget;
    setCreatePending(true);
    setCreateState(initialState);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: new FormData(form),
      });
      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: { message?: string } }
        | null;

      if (!response.ok || !result?.ok) {
        setCreateState({
          ok: false,
          error: result?.error?.message ?? "Unable to upload document.",
        });
        return;
      }

      formRef.current?.reset();
      setSelectedFilename("");
      setTitle("");
      setOpen(false);
      router.refresh();
    } catch {
      setCreateState({
        ok: false,
        error: "Unable to upload document.",
      });
    } finally {
      setCreatePending(false);
    }
  }

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Button
        className={cn(mode === "create" ? "w-full sm:w-auto" : undefined, triggerClassName)}
        onClick={() => setOpen(true)}
        size={triggerSize}
        type="button"
        variant={triggerVariant ?? (mode === "create" ? "default" : "outline")}
      >
        {mode === "create" ? <Upload className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        {triggerLabel}
      </Button>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(2,6,23,0.58)] backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[28px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl md:inset-auto md:left-1/2 md:top-1/2 md:w-[min(720px,calc(100vw-2rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[28px] md:p-6">
          <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-[var(--border)] md:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-2xl font-semibold tracking-tight">
                {mode === "create" ? "Upload document" : "Edit document"}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-[var(--muted-foreground)]">
                Keep receipts, service invoices, registration, warranty records, and manuals with this vehicle.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="rounded-full p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form
            action={mode === "edit" ? updateAction : undefined}
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={mode === "create" ? handleCreateSubmit : undefined}
            ref={formRef}
          >
            <input name="vehicleId" type="hidden" value={vehicleId} />
            {document ? <input name="documentId" type="hidden" value={document.id} /> : null}
            {mode === "create" ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`document-file-${mode}`}>File</Label>
                <label className="flex cursor-pointer items-center justify-between rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--muted)] px-4 py-4 text-sm">
                  <span className="truncate text-[var(--muted-foreground)]">
                    {selectedFilename || "Choose a PDF or image"}
                  </span>
                  <FileUp className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <input
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                    id={`document-file-${mode}`}
                    name="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (!file) {
                        return;
                      }

                      setSelectedFilename(file.name);
                      if (!title.trim()) {
                        setTitle(titleFromFilename(file.name));
                      }
                    }}
                    type="file"
                  />
                </label>
              </div>
            ) : null}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`document-title-${mode}`}>Title</Label>
              <Input
                id={`document-title-${mode}`}
                name="title"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Service invoice"
                value={title}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`document-category-${mode}`}>Category</Label>
              <select
                className="flex h-11 w-full rounded-[22px] border border-[var(--border)] bg-[var(--input)] px-4 text-sm outline-none"
                defaultValue={document?.category ?? "RECEIPT"}
                id={`document-category-${mode}`}
                name="category"
              >
                {categories.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`document-date-${mode}`}>Date</Label>
              <Input defaultValue={defaultDate} id={`document-date-${mode}`} name="occurredAt" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`document-odometer-${mode}`}>Odometer, optional</Label>
              <Input
                defaultValue={document?.odometer !== null && document?.odometer !== undefined ? String(document.odometer) : latestMileage !== null ? String(latestMileage) : ""}
                id={`document-odometer-${mode}`}
                name="odometer"
                placeholder="14512"
                type="number"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`document-notes-${mode}`}>Notes, optional</Label>
              <textarea
                className="min-h-[110px] w-full rounded-[22px] border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-sm outline-none"
                defaultValue={document?.notes ?? ""}
                id={`document-notes-${mode}`}
                name="notes"
                placeholder="Optional notes about this document."
              />
            </div>
            {error ? <p className="sm:col-span-2 text-sm text-amber-300">{error}</p> : null}
            <div className="sm:col-span-2">
              <Button disabled={pending}>{mode === "create" ? "Save document" : "Save changes"}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
