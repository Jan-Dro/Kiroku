"use server";

import { redirect } from "next/navigation";
import { clearSession, createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { loginSchema, registerSchema } from "@/lib/validators/auth";

type AuthActionState = {
  ok: boolean;
  error: string;
};

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    emailOrUsername: formData.get("emailOrUsername"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid login request.",
    };
  }

  const user = await db.user.findFirst({
    where: {
      OR: [
        { email: parsed.data.emailOrUsername.toLowerCase() },
        { username: parsed.data.emailOrUsername },
      ],
    },
  });

  if (!user) {
    return { ok: false, error: "Invalid credentials." };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!valid) {
    return { ok: false, error: "Invalid credentials." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (env.REGISTRATION_ENABLED !== "true") {
    return { ok: false, error: "Registration is disabled." };
  }

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid registration request.",
    };
  }

  const existing = await db.user.findFirst({
    where: {
      OR: [
        { email: parsed.data.email.toLowerCase() },
        { username: parsed.data.username },
      ],
    },
  });

  if (existing) {
    return { ok: false, error: "A user with those credentials already exists." };
  }

  const user = await db.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      passwordHash: await hashPassword(parsed.data.password),
      preferences: {
        create: {
          currencyCode: env.DEFAULT_CURRENCY,
          distanceUnit: env.DEFAULT_DISTANCE_UNIT,
          volumeUnit: env.DEFAULT_VOLUME_UNIT,
          economyUnit: env.DEFAULT_ECONOMY_UNIT,
        },
      },
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
