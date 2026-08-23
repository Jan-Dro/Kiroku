import { FuelType } from "@prisma/client";
import { z } from "zod";

export const vehicleSchema = z.object({
  nickname: z.string().trim().min(1).max(50),
  year: z.coerce.number().int().min(1900).max(2100),
  make: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(50),
  trim: z.string().trim().max(50).optional().or(z.literal("")),
  vin: z.string().trim().max(17).optional().or(z.literal("")),
  licensePlate: z.string().trim().max(15).optional().or(z.literal("")),
  purchaseDate: z.string().optional().or(z.literal("")),
  purchaseMileage: z.coerce.number().int().min(0).optional(),
  currentMileage: z.coerce.number().int().min(0).optional(),
  purchasePrice: z.string().trim().optional().or(z.literal("")),
  engine: z.string().trim().max(60).optional().or(z.literal("")),
  drivetrain: z.string().trim().max(40).optional().or(z.literal("")),
  transmission: z.string().trim().max(40).optional().or(z.literal("")),
  fuelType: z.nativeEnum(FuelType).optional().nullable(),
  exteriorColor: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});
