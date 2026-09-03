"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteFuelEntryAction } from "@/app/actions/vehicles";
import { Button } from "@/components/ui/button";

export function DeleteFuelEntryButton({ fuelEntryId }: { fuelEntryId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this fuel entry? This cannot be undone.")) {
          return;
        }

        startTransition(async () => {
          const formData = new FormData();
          formData.set("fuelEntryId", fuelEntryId);
          await deleteFuelEntryAction(formData);
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
