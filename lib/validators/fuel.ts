import { z } from "zod";

export const fuelEntrySchema = z.object({
  vehicleId: z.string().cuid(),
  occurredAt: z.date(),
  odometer: z.number().int().positive(),
  volume: z.number().positive(),
  pricePerUnit: z.number().positive(),
  totalCostCents: z.bigint().nonnegative(),
  isFullTank: z.boolean(),
});
