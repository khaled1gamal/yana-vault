import { Timestamp } from "firebase-admin/firestore";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { publicCapsuleId } from "@/constants/capsule";
import { calculateUnlockAt, isVaultUnlocked } from "@/lib/time/unlock";
import type { CapsuleConfig, ServerTimePayload } from "@/types/models";

function asIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return "";
}

export async function readCapsuleConfig(capsuleId = publicCapsuleId()): Promise<CapsuleConfig | null> {
  if (!isAdminConfigured()) return null;
  const snap = await adminDb().doc(`capsules/${capsuleId}/settings/config`).get();
  if (!snap.exists) return null;
  const data = snap.data() ?? {};
  return {
    ...(data as CapsuleConfig),
    unlockAt: asIso(data.unlockAt),
    updatedAt: asIso(data.updatedAt) || (data.updatedAt as string),
  };
}

export async function getTrustedUnlockState(capsuleId = publicCapsuleId()): Promise<ServerTimePayload> {
  const serverNow = new Date();
  const config = await readCapsuleConfig(capsuleId);

  if (!config) {
    return {
      serverNowIso: serverNow.toISOString(),
      unlockAtIso: null,
      timezone: "Asia/Manila",
      isUnlocked: false,
      recipientName: process.env.NEXT_PUBLIC_RECIPIENT_FIRST_NAME || "Yana",
      capsuleTitle: "Digital Time Capsule",
      welcomeMessage: "This vault is still being prepared.",
    };
  }

  return {
    serverNowIso: serverNow.toISOString(),
    unlockAtIso: config.unlockAt,
    timezone: config.timezone,
    isUnlocked: isVaultUnlocked(serverNow, new Date(config.unlockAt)),
    recipientName: config.recipientName,
    capsuleTitle: config.title,
    welcomeMessage: config.welcomeMessage,
  };
}

export function computeUnlockIso(birthDate: string, timezone: string, age: number) {
  return calculateUnlockAt(birthDate, timezone, age);
}
