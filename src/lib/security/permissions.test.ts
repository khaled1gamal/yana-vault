import { describe, expect, it } from "vitest";
import {
  canChangeUnlockDate,
  canCreateFamilyMessage,
  canCreateRecipientMemory,
  canReadFamilyMessage,
  canReadSealedMemoryContent,
} from "@/lib/security/permissions";

const locked = {
  userId: "r1",
  capsuleId: "yana-vault",
  isUnlocked: false,
} as const;

describe("permissions", () => {
  it("never lets the recipient read sealed memory content before unlock", () => {
    expect(canReadSealedMemoryContent({ ...locked, role: "recipient" })).toBe(false);
    expect(canReadSealedMemoryContent({ ...locked, role: "family", userId: "f1" })).toBe(false);
    expect(canReadSealedMemoryContent({ ...locked, role: "admin" })).toBe(true);
  });

  it("lets the recipient read memories only after server unlock", () => {
    expect(canReadSealedMemoryContent({ ...locked, role: "recipient", isUnlocked: true })).toBe(true);
    expect(canReadSealedMemoryContent({ ...locked, role: "family", userId: "f1", isUnlocked: true })).toBe(false);
  });

  it("lets family read only their own messages before and after unlock", () => {
    expect(canReadFamilyMessage({ ...locked, role: "family", userId: "f1" }, "f1")).toBe(true);
    expect(canReadFamilyMessage({ ...locked, role: "family", userId: "f1" }, "f2")).toBe(false);
    expect(canReadFamilyMessage({ ...locked, role: "family", userId: "f1", isUnlocked: true }, "f1")).toBe(true);
    expect(canReadFamilyMessage({ ...locked, role: "family", userId: "f1", isUnlocked: true }, "f2")).toBe(false);
    expect(canReadFamilyMessage({ ...locked, role: "recipient" }, "f1")).toBe(false);
    expect(canReadFamilyMessage({ ...locked, role: "recipient", isUnlocked: true }, "f1")).toBe(true);
    expect(canReadFamilyMessage({ ...locked, role: "admin" }, "f1")).toBe(true);
  });

  it("restricts create and unlock-date changes by role", () => {
    expect(canCreateRecipientMemory("recipient")).toBe(true);
    expect(canCreateRecipientMemory("family")).toBe(false);
    expect(canCreateFamilyMessage("family")).toBe(true);
    expect(canCreateFamilyMessage("recipient")).toBe(false);
    expect(canChangeUnlockDate("recipient")).toBe(false);
    expect(canChangeUnlockDate("admin")).toBe(true);
  });
});
