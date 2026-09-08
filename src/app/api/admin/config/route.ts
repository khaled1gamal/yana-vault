import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { DEFAULT_TIMEZONE, UNLOCK_AGE_YEARS, publicCapsuleId } from "@/constants/capsule";
import { requireRole, revokeFamilyUserAccess, writeAudit } from "@/lib/auth/session";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { computeUnlockIso, readCapsuleConfig } from "@/lib/time/serverTime";
import { AppError, toUserMessage } from "@/lib/errors";
import { capsuleConfigUpdateSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/security/rateLimit";

export async function GET() {
  try {
    const session = await requireRole(["admin"]);
    const config = await readCapsuleConfig(session.capsuleId);
    return NextResponse.json({ config });
  } catch (error) {
    const status = error instanceof AppError && error.code === "unauthenticated" ? 401 : 403;
    return NextResponse.json({ error: toUserMessage(error) }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireRole(["admin"]);
    if (!rateLimit(`admin-config:${session.uid}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many configuration changes." }, { status: 429 });
    }
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: "Admin SDK is not configured." }, { status: 503 });
    }

    const parsed = capsuleConfigUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => {
          const path = issue.path.join(".");
          return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join("; ");
      return NextResponse.json(
        { error: `Please check the configuration fields: ${details}`, details: parsed.error.issues },
        { status: 400 },
      );
    }

    const current = await readCapsuleConfig(session.capsuleId);
    const unlockChanged =
      current &&
      (current.birthDate !== parsed.data.birthDate || current.timezone !== parsed.data.timezone);
    if (unlockChanged && parsed.data.confirmUnlockChange !== true) {
      return NextResponse.json(
        {
          error: "Changing the unlock date is protected. Confirm the change explicitly.",
          requiresConfirmation: true,
        },
        { status: 409 },
      );
    }

    const oldFamilyEmails = (current?.familyEmails ?? []).map((email) => email.toLowerCase());
    const newFamilyEmails = parsed.data.familyEmails.map((email) => email.toLowerCase());
    const removedFamilyEmails = oldFamilyEmails.filter((email) => !newFamilyEmails.includes(email));

    for (const email of removedFamilyEmails) {
      await revokeFamilyUserAccess(email, session.capsuleId, session.uid);
    }

    const computed = computeUnlockIso(parsed.data.birthDate, parsed.data.timezone, UNLOCK_AGE_YEARS);
    const unlockAt = Timestamp.fromDate(computed.unlockAtUtc);
    const payload = {
      capsuleId: session.capsuleId,
      title: parsed.data.title,
      recipientName: parsed.data.recipientName,
      recipientUserId: current?.recipientUserId ?? null,
      birthDate: parsed.data.birthDate,
      timezone: parsed.data.timezone,
      unlockAgeYears: UNLOCK_AGE_YEARS,
      unlockAt,
      theme: parsed.data.theme,
      welcomeMessage: parsed.data.welcomeMessage,
      status: parsed.data.status,
      maxImageBytes: parsed.data.maxImageBytes,
      maxAudioBytes: parsed.data.maxAudioBytes,
      maxRecordingSeconds: parsed.data.maxRecordingSeconds,
      familyEmails: newFamilyEmails,
      updatedAt: new Date().toISOString(),
      updatedBy: session.uid,
    };

    await adminDb().doc(`capsules/${session.capsuleId}/settings/config`).set(payload, { merge: true });
    await adminDb().doc(`capsules/${session.capsuleId}`).set(
      {
        id: session.capsuleId,
        title: payload.title,
        recipientName: payload.recipientName,
        status: payload.status,
      },
      { merge: true },
    );

    await writeAudit({
      capsuleId: session.capsuleId,
      actorId: session.uid,
      actorRole: session.role,
      action: unlockChanged ? "unlock_date_changed" : "configuration_changed",
      targetType: "config",
      targetId: session.capsuleId,
      metadata: {
        birthDate: parsed.data.birthDate,
        previousBirthDate: current?.birthDate ?? "",
        timezone: parsed.data.timezone,
        previousTimezone: current?.timezone ?? "",
      },
    });

    return NextResponse.json({
      ok: true,
      unlockAtIso: computed.unlockAtIso,
      unlockAtLocalIso: computed.unlockAtLocalIso,
    });
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error) }, { status: 400 });
  }
}

export async function POST() {
  try {
    const session = await requireRole(["admin"]);
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: "Admin SDK is not configured." }, { status: 503 });
    }

    const existing = await readCapsuleConfig(session.capsuleId);
    if (existing) {
      return NextResponse.json({ ok: true, alreadyInitialized: true, config: existing });
    }

    const birthDate = process.env.SEED_BIRTH_DATE || "2011-01-01";
    const timezone = process.env.SEED_TIMEZONE || DEFAULT_TIMEZONE;
    const computed = computeUnlockIso(birthDate, timezone, UNLOCK_AGE_YEARS);
    const capsuleId = session.capsuleId || publicCapsuleId();
    const payload = {
      capsuleId,
      title: process.env.SEED_CAPSULE_TITLE || "Yana's Digital Time Capsule",
      recipientName: process.env.SEED_RECIPIENT_NAME || "Yana",
      recipientUserId: null,
      birthDate,
      timezone,
      unlockAgeYears: UNLOCK_AGE_YEARS,
      unlockAt: Timestamp.fromDate(computed.unlockAtUtc),
      theme: "midnight-lilac",
      welcomeMessage: "Welcome to your 18th birthday vault. You made it, mahal.",
      status: "active",
      maxImageBytes: 8 * 1024 * 1024,
      maxAudioBytes: 10 * 1024 * 1024,
      maxRecordingSeconds: 90,
      familyEmails: (process.env.FAMILY_EMAILS || "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
      updatedAt: new Date().toISOString(),
      updatedBy: session.uid,
    };

    await adminDb().doc(`capsules/${capsuleId}`).set({
      id: capsuleId,
      title: payload.title,
      recipientName: payload.recipientName,
      status: payload.status,
    });
    await adminDb().doc(`capsules/${capsuleId}/settings/config`).set(payload);

    await writeAudit({
      capsuleId,
      actorId: session.uid,
      actorRole: "admin",
      action: "configuration_changed",
      targetType: "config",
      targetId: capsuleId,
      metadata: { initialized: "true" },
    });

    return NextResponse.json({ ok: true, unlockAtIso: computed.unlockAtIso });
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error) }, { status: 400 });
  }
}
