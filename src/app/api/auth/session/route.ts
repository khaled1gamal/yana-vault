import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/constants/capsule";
import { bootstrapUser, createSessionCookie, readSession, writeAudit } from "@/lib/auth/session";
import { AppError, toUserMessage } from "@/lib/errors";
import { rateLimit } from "@/lib/security/rateLimit";

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  try {
    if (!rateLimit(`session:${clientIp(request)}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Please wait." }, { status: 429 });
    }

    const body = (await request.json()) as { idToken?: string; step?: "bootstrap" | "cookie" };
    if (!body.idToken) {
      return NextResponse.json({ error: "Missing sign-in token." }, { status: 400 });
    }

    if (body.step !== "cookie") {
      const profile = await bootstrapUser(body.idToken, clientIp(request));
      return NextResponse.json({ ok: true, profile, refreshToken: true });
    }

    const expiresMs = Number(process.env.SESSION_EXPIRES_MS || 5 * 24 * 60 * 60 * 1000);
    const sessionCookie = await createSessionCookie(body.idToken, expiresMs);
    const jar = await cookies();
    jar.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresMs / 1000),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const status =
      error instanceof AppError
        ? error.code === "permission_denied"
          ? 403
          : error.code === "invalid_input"
            ? 400
            : error.code === "unavailable"
              ? 503
              : 401
        : 401;
    return NextResponse.json({ error: toUserMessage(error) }, { status });
  }
}

export async function DELETE() {
  const session = await readSession();
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  if (session) {
    await writeAudit({
      capsuleId: session.capsuleId,
      actorId: session.uid,
      actorRole: session.role,
      action: "logout",
      targetType: "session",
      targetId: session.uid,
    });
  }
  return NextResponse.json({ ok: true });
}
