import type { UserRole } from "@/types/models";

export interface AccessContext {
  role: UserRole;
  userId: string;
  capsuleId: string;
  isUnlocked: boolean;
}

export function canManageConfig(role: UserRole): boolean {
  return role === "admin";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}

export function canCreateRecipientMemory(role: UserRole): boolean {
  return role === "recipient" || role === "admin";
}

export function canCreateFamilyMessage(role: UserRole): boolean {
  return role === "family" || role === "admin";
}

export function canReadSealedMemoryContent(ctx: AccessContext): boolean {
  if (ctx.role === "admin") return true;
  if (ctx.role === "recipient" && ctx.isUnlocked) return true;
  return false;
}

export function canReadFamilyMessage(ctx: AccessContext, authorId: string): boolean {
  if (ctx.role === "admin") return true;
  if (ctx.role === "family" && ctx.userId === authorId) return true;
  if (ctx.role === "recipient" && ctx.isUnlocked) return true;
  return false;
}

export function canReadMemoryIndex(role: UserRole): boolean {
  return role === "admin" || role === "family" || role === "recipient";
}

export function canChangeUnlockDate(role: UserRole): boolean {
  return role === "admin";
}

export function assertNeverClientUnlock(decisionSource: "server" | "client"): void {
  if (decisionSource !== "server") {
    throw new Error("Unlock decisions must be made on the server");
  }
}
