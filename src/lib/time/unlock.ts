import { DateTime } from "luxon";
import { DEFAULT_TIMEZONE, UNLOCK_AGE_YEARS } from "@/constants/capsule";

export interface UnlockComputation {
  timezone: string;
  birthDate: string;
  unlockAtUtc: Date;
  unlockAtIso: string;
  unlockAtLocalIso: string;
}

export function calculateUnlockAt(
  birthDateIso: string,
  timezone: string = DEFAULT_TIMEZONE,
  ageYears: number = UNLOCK_AGE_YEARS,
): UnlockComputation {
  const birth = DateTime.fromISO(birthDateIso, { zone: timezone });
  if (!birth.isValid) {
    throw new Error("Invalid birth date");
  }
  if (!Number.isInteger(ageYears) || ageYears < 1 || ageYears > 120) {
    throw new Error("Invalid unlock age");
  }

  const unlockLocal = birth.plus({ years: ageYears }).startOf("day");
  if (!unlockLocal.isValid) {
    throw new Error("Unable to compute unlock timestamp");
  }

  const unlockAtUtc = unlockLocal.toUTC().toJSDate();
  return {
    timezone,
    birthDate: birth.toISODate() ?? birthDateIso,
    unlockAtUtc,
    unlockAtIso: unlockLocal.toUTC().toISO() ?? unlockAtUtc.toISOString(),
    unlockAtLocalIso: unlockLocal.toISO() ?? "",
  };
}

export function isVaultUnlocked(now: Date, unlockAt: Date): boolean {
  return now.getTime() >= unlockAt.getTime();
}

export function remainingUntil(now: Date, unlockAt: Date) {
  const totalMs = Math.max(0, unlockAt.getTime() - now.getTime());
  const seconds = Math.floor(totalMs / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return { totalMs, days, hours, minutes, seconds: secs, isUnlocked: totalMs === 0 };
}

export function parseIsoToUtcDate(iso: string): Date {
  const dt = DateTime.fromISO(iso, { setZone: true }).toUTC();
  if (!dt.isValid) {
    throw new Error("Invalid ISO timestamp");
  }
  return dt.toJSDate();
}

export function formatManila(isoOrDate: string | Date, timezone: string = DEFAULT_TIMEZONE): string {
  const dt =
    typeof isoOrDate === "string"
      ? DateTime.fromISO(isoOrDate, { setZone: true })
      : DateTime.fromJSDate(isoOrDate, { zone: "utc" });
  return dt.setZone(timezone).toFormat("cccc, LLLL d, yyyy 'at' HH:mm ZZZZ");
}
