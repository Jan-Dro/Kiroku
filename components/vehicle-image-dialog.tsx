"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { Camera, ImageUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState = {
  ok: false,
  error: "",
};

export function VehicleImageDialog({
  vehicleId,
  hasImage,
}: {
  vehicleId: string;
  hasImage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [filename, setFilename] = useState("");
  const [pending, setPending] = useState(false);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      setFilename("");
    }
  }, [state.ok]);

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Button onClick={() => setOpen(true)} type="button" variant="outline">
        <Camera className="h-4 w-4" />
        {hasImage ? "Change photo" : "Add photo"}
      </Button>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(2,6,23,0.58)] backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[28px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl md:inset-auto md:left-1/2 md:top-1/2 md:w-[min(540px,calc(100vw-2rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[28px] md:p-6">
          <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-[var(--border)] md:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-2xl font-semibold tracking-tight">
                {hasImage ? "Change vehicle photo" : "Add vehicle photo"}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-[var(--muted-foreground)]">
                Upload a JPEG, PNG, or WebP image for this vehicle.
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
            onSubmit={async (e) => {
              e.preventDefault();
              setPending(true);
              setState(initialState);

              const form = e.currentTarget as HTMLFormElement;
              const input = form.elements.namedItem("image") as HTMLInputElement | null;
              const file = input?.files?.[0];

              if (!file) {
                setState({ ok: false, error: "Choose an image to upload." });
                setPending(false);
                return;
              }

              const fd = new FormData();
              fd.append("vehicleId", vehicleId);
              fd.append("image", file);

              try {
                const res = await fetch(`/api/vehicles/${vehicleId}/image`, {
                  method: "POST",
                  body: fd,
                });

                if (!res.ok) {
                  const body = await res.json().catch(() => ({}));
                  setState({ ok: false, error: body?.error?.message ?? `Upload failed (${res.status})` });
                  setPending(false);
                  return;
                }

                setState({ ok: true, error: "" });
                setPending(false);
              } catch (err) {
                setState({ ok: false, error: err instanceof Error ? err.message : String(err) });
                setPending(false);
              }
            }}
            className="mt-6 grid gap-4">
            <input name="vehicleId" type="hidden" value={vehicleId} />
            <div className="space-y-2">
              <Label htmlFor="vehicle-image-upload">Photo</Label>
              <label className="flex cursor-pointer items-center justify-between rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--muted)] px-4 py-4 text-sm">
                <span className="truncate text-[var(--muted-foreground)]">
                  {filename || "Choose a vehicle photo"}
                </span>
                <ImageUp className="h-4 w-4 text-[var(--muted-foreground)]" />
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="vehicle-image-upload"
                  name="image"
                  onChange={(event) => setFilename(event.target.files?.[0]?.name ?? "")}
                  type="file"
                />
              </label>
            </div>
            {state.error ? <p className="text-sm text-amber-300">{state.error}</p> : null}
            <div>
              <Button disabled={pending}>{pending ? "Uploading..." : hasImage ? "Save new photo" : "Save photo"}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
