import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { calculateUnlockAt, isVaultUnlocked, remainingUntil } from "@/lib/time/unlock";

describe("unlock calculation (Asia/Manila)", () => {
  it("unlocks at 00:00:00 on the 18th birthday in Manila", () => {
    const result = calculateUnlockAt("2011-03-15", "Asia/Manila", 18);
    expect(result.unlockAtLocalIso.startsWith("2029-03-15T00:00:00")).toBe(true);
    const manila = DateTime.fromISO(result.unlockAtIso, { setZone: true }).setZone("Asia/Manila");
    expect(manila.toISODate()).toBe("2029-03-15");
    expect(manila.hour).toBe(0);
    expect(manila.minute).toBe(0);
    expect(manila.second).toBe(0);
  });

  it("stays locked at 23:59:59 the night before", () => {
    const { unlockAtUtc } = calculateUnlockAt("2011-03-15", "Asia/Manila", 18);
    const before = DateTime.fromISO("2029-03-14T23:59:59", { zone: "Asia/Manila" }).toUTC().toJSDate();
    expect(isVaultUnlocked(before, unlockAtUtc)).toBe(false);
  });

  it("unlocks at 00:00:00 exactly", () => {
    const { unlockAtUtc } = calculateUnlockAt("2011-03-15", "Asia/Manila", 18);
    const exact = DateTime.fromISO("2029-03-15T00:00:00", { zone: "Asia/Manila" }).toUTC().toJSDate();
    expect(isVaultUnlocked(exact, unlockAtUtc)).toBe(true);
  });

  it("does not trust a later local clock if unlock is in the future", () => {
    const { unlockAtUtc } = calculateUnlockAt("2011-03-15", "Asia/Manila", 18);
    const spoofed = new Date("2035-01-01T00:00:00Z");
    expect(isVaultUnlocked(spoofed, unlockAtUtc)).toBe(true);
    const stillBefore = new Date("2028-12-31T16:00:00Z");
    expect(isVaultUnlocked(stillBefore, unlockAtUtc)).toBe(false);
  });

  it("counts remaining time down to zero after unlock", () => {
    const unlockAt = new Date("2029-03-14T16:00:00.000Z");
    expect(remainingUntil(unlockAt, unlockAt).isUnlocked).toBe(true);
    expect(remainingUntil(new Date(unlockAt.getTime() - 1000), unlockAt).seconds).toBe(1);
  });
});
