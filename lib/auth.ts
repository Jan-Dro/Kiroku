import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { shouldUseSecureSessionCookie } from "@/lib/session-cookie";

const SESSION_COOKIE = "vm_session";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 30;
const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;
const secret = new TextEncoder().encode(env.SESSION_SECRET);

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export async function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

export async function verifyPassword(password: string, passwordHash: string) {
  return argon2.verify(passwordHash, password);
}

async function signSessionToken(sessionId: string) {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_AGE_SECONDS}s`)
    .sign(secret);
}

async function verifySessionToken(token: string) {
  const result = await jwtVerify<{ sid: string }>(token, secret);
  return result.payload.sid;
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);
  const headerStore = await headers();
  const cookieStore = await cookies();

  const session = await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + SESSION_AGE_SECONDS * 1000),
      userAgent: headerStore.get("user-agent") ?? undefined,
      ipAddress: headerStore.get("x-forwarded-for") ?? undefined,
    },
  });

  const signed = await signSessionToken(`${session.id}.${rawToken}`);

  cookieStore.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureSessionCookie(env.APP_URL),
    path: "/",
    maxAge: SESSION_AGE_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      const value = await verifySessionToken(token);
      const [sessionId] = value.split(".");
      await db.session.delete({ where: { id: sessionId } }).catch(() => null);
    } catch {
      // Ignore invalid cookies and clear them below.
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  let value: string;

  try {
    value = await verifySessionToken(token);
  } catch {
    return null;
  }

  const [sessionId, rawToken] = value.split(".");

  if (!sessionId || !rawToken) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: {
          preferences: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || session.tokenHash !== sha256(rawToken)) {
    return null;
  }

  if (Date.now() - session.lastSeenAt.getTime() >= SESSION_TOUCH_INTERVAL_MS) {
    await db.session.update({
      where: { id: session.id },
      data: {
        lastSeenAt: new Date(),
      },
    }).catch((error) => {
      console.error("Unable to update session activity.", error);
    });
  }

  return session.user;
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
