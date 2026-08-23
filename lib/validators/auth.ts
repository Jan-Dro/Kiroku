import { z } from "zod";

export const loginSchema = z.object({
  emailOrUsername: z.string().trim().min(3),
  password: z.string().min(8),
});

export const registerSchema = z
  .object({
    email: z.string().trim().email(),
    username: z
      .string()
      .trim()
      .min(3)
      .max(32)
      .regex(/^[a-zA-Z0-9_-]+$/),
    displayName: z.string().trim().min(2).max(50),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });
