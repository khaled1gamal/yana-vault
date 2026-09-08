import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/constants/capsule";
import { adminAuth, adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { rateLimit } from "@/lib/security/rateLimit";
import { AppError } from "@/lib/errors";
import type { UserRole } from "@/types/models";
import { envRoleForEmail } from "@/lib/auth/roles";

export interface SessionUser {
  uid: string;
  email: string;
  role: UserRole;
  capsuleId: string;
  displayName: string;
}

export function roleForEmail(email: string, extraFamily: string[] = []): UserRole | null {
  return envRoleForEmail(email, extraFamily);
}

export async function createSessionCookie(idToken: string, expiresMs: number) {
  if (!isAdminConfigured()) {
    throw new AppError("unavailable", "Server authentication is not configured yet.");
  }
  return adminAuth().createSessionCookie(idToken, { expiresIn: expiresMs });
}

export async function readSession(): Promise<SessionUser | null> {
  if (!isAdminConfigured()) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(token, true);
    const role = decoded.role as UserRole | undefined;
    const capsuleId = decoded.capsuleId as string | undefined;
    if (!decoded.email || !role || !capsuleId) return null;

    if (role === "family") {
      const configSnap = await adminDb().doc(`capsules/${capsuleId}/settings/config`).get();
      const familyEmails = (configSnap.data()?.familyEmails as string[] | undefined) ?? [];
      const currentRole = roleForEmail(decoded.email, familyEmails);
      if (currentRole !== "family") {
        return null;
      }
    }

    return {
      uid: decoded.uid,
      email: decoded.email,
      role,
      capsuleId,
      displayName: decoded.name || decoded.email.split("@")[0] || "Guest",
    };
  } catch {
    return null;
  }
}

export async function revokeFamilyUserAccess(
  email: string,
  capsuleId: string,
  adminUid: string,
): Promise<void> {
  if (!isAdminConfigured()) return;
  const normalized = email.toLowerCase();
  try {
    const userRecord = await adminAuth().getUserByEmail(normalized);
    if (!userRecord) return;

    await adminAuth().setCustomUserClaims(userRecord.uid, { role: null, capsuleId: null });
    await adminAuth().revokeRefreshTokens(userRecord.uid);
    await adminDb().doc(`users/${userRecord.uid}`).set(
      {
        role: null,
        revokedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    await writeAudit({
      capsuleId,
      actorId: adminUid,
      actorRole: "admin",
      action: "family_access_revoked",
      targetType: "user",
      targetId: userRecord.uid,
      metadata: { email: normalized },
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code !== "auth/user-not-found") {
      console.warn(`Failed to revoke family user access for ${normalized}:`, error);
    }
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await readSession();
  if (!session) {
    throw new AppError("unauthenticated", "Please sign in to continue.", true);
  }
  return session;
}

export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    throw new AppError("permission_denied", "You don’t have access to that.");
  }
  return session;
}

export async function bootstrapUser(idToken: string, ip: string) {
  if (!rateLimit(`bootstrap:${ip}`, 20, 60_000)) {
    throw new AppError("unknown", "Too many sign-in attempts. Please wait a moment.");
  }
  if (!isAdminConfigured()) {
    throw new AppError("unavailable", "Server authentication is not configured yet.");
  }

  const decoded = await adminAuth().verifyIdToken(idToken, true);
  const email = decoded.email?.toLowerCase();
  if (!email) {
    throw new AppError("invalid_input", "This account needs an email address.");
  }

  const capsuleId = process.env.NEXT_PUBLIC_CAPSULE_ID || "yana-vault";
  const configSnap = await adminDb().doc(`capsules/${capsuleId}/settings/config`).get();
  const familyEmails = (configSnap.data()?.familyEmails as string[] | undefined) ?? [];
  const role = roleForEmail(email, familyEmails);

  if (!role) {
    throw new AppError(
      "permission_denied",
      "This vault is private. Ask an admin to invite this email.",
    );
  }

  await adminAuth().setCustomUserClaims(decoded.uid, { role, capsuleId });

  const now = new Date().toISOString();
  await adminDb().doc(`users/${decoded.uid}`).set(
    {
      email,
      displayName: decoded.name || email.split("@")[0],
      role,
      capsuleId,
      createdAt: now,
      lastLoginAt: now,
    },
    { merge: true },
  );

  await writeAudit({
    capsuleId,
    actorId: decoded.uid,
    actorRole: role,
    action: "login",
    targetType: "session",
    targetId: decoded.uid,
    metadata: { email },
  });

  return { role, capsuleId, email, uid: decoded.uid };
}

export async function writeAudit(entry: {
  capsuleId: string;
  actorId: string;
  actorRole: UserRole | "anonymous";
  action: string;
  targetType: string;
  targetId: string | null;
  metadata?: Record<string, string>;
}) {
  if (!isAdminConfigured()) return;
  await adminDb()
    .collection(`capsules/${entry.capsuleId}/auditLogs`)
    .add({
      ...entry,
      metadata: entry.metadata ?? {},
      createdAt: new Date().toISOString(),
    });
}
