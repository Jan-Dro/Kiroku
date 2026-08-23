"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteVehicleDocumentAction } from "@/app/actions/vehicles";
import { Button } from "@/components/ui/button";

export function DeleteDocumentButton({ documentId }: { documentId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this document? This cannot be undone.")) {
          return;
        }

        startTransition(async () => {
          const formData = new FormData();
          formData.set("documentId", documentId);
          await deleteVehicleDocumentAction(formData);
        });
      }}
      size="sm"
      type="button"
      variant="ghost"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  );
}
