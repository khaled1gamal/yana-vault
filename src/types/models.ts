import type {
  FAMILY_MESSAGE_TYPES,
  MEMORY_TYPES,
} from "@/constants/capsule";

export type UserRole = "admin" | "family" | "recipient";
export type CapsuleStatus = "active" | "paused" | "archived";
export type MemoryStatus = "draft" | "sealed" | "unlocked";
export type MemoryType = (typeof MEMORY_TYPES)[number];
export type FamilyMessageType = (typeof FAMILY_MESSAGE_TYPES)[number];

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  capsuleId: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface CapsuleConfig {
  capsuleId: string;
  title: string;
  recipientName: string;
  recipientUserId: string | null;
  birthDate: string;
  timezone: string;
  unlockAgeYears: number;
  unlockAt: string;
  theme: "midnight-lilac";
  welcomeMessage: string;
  status: CapsuleStatus;
  maxImageBytes: number;
  maxAudioBytes: number;
  maxRecordingSeconds: number;
  familyEmails: string[];
  updatedAt: string;
  updatedBy: string | null;
}

export interface CapsuleSummary {
  id: string;
  title: string;
  recipientName: string;
  status: CapsuleStatus;
}

export interface StorageFileRef {
  path: string;
  contentType: string;
  size: number;
  fileId: string;
}

export interface MemoryIndex {
  id: string;
  capsuleId: string;
  authorId: string;
  authorRole: UserRole;
  type: MemoryType;
  createdAt: string;
  status: MemoryStatus;
  mediaCount: number;
  hasAudio: boolean;
}

export interface VibeCheck {
  favoriteSpotifySong: string;
  favoriteKpopArtist: string;
  favoriteAnime: string;
  favoriteCelebrity: string;
  bestFriends: string;
  favoriteFood: string;
  favoriteColor: string;
  currentAesthetic: string;
  currentMood: string;
  favoriteQuote: string;
  currentDream: string;
  whatILoveRightNow: string;
  whatIWantToChange: string;
  whatIHopeFutureRemembers: string;
}

export interface Memory {
  id: string;
  capsuleId: string;
  authorId: string;
  authorRole: UserRole;
  type: MemoryType;
  title: string;
  content: string;
  caption: string;
  mood: string;
  tags: string[];
  vibe: VibeCheck | null;
  createdAt: string;
  updatedAt: string;
  unlockAt: string;
  isLocked: boolean;
  status: MemoryStatus;
  storagePaths: StorageFileRef[];
  metadata: Record<string, string | number | boolean>;
}

export interface FamilyMessageIndex {
  id: string;
  capsuleId: string;
  authorId: string;
  authorRole: UserRole;
  type: FamilyMessageType;
  createdAt: string;
  mediaCount: number;
  hasAudio: boolean;
}

export interface FamilyMessage {
  id: string;
  capsuleId: string;
  authorId: string;
  authorRole: UserRole;
  type: FamilyMessageType;
  title: string;
  content: string;
  caption: string;
  createdAt: string;
  updatedAt: string;
  unlockAt: string;
  isLocked: boolean;
  status: MemoryStatus;
  storagePaths: StorageFileRef[];
}

export interface AuditLog {
  id: string;
  capsuleId: string;
  actorId: string;
  actorRole: UserRole | "anonymous";
  action: AuditAction;
  targetType: string;
  targetId: string | null;
  createdAt: string;
  metadata: Record<string, string>;
}

export type AuditAction =
  | "login"
  | "logout"
  | "memory_created"
  | "memory_updated"
  | "memory_deleted"
  | "family_message_created"
  | "family_message_updated"
  | "family_message_deleted"
  | "file_uploaded"
  | "file_deleted"
  | "permission_denied"
  | "vault_unlocked"
  | "configuration_changed"
  | "unlock_date_changed"
  | "user_role_assigned";

export interface ServerTimePayload {
  serverNowIso: string;
  unlockAtIso: string | null;
  timezone: string;
  isUnlocked: boolean;
  recipientName: string;
  capsuleTitle: string;
  welcomeMessage: string;
}

export interface VaultPreviewCounts {
  letters: number;
  photos: number;
  voices: number;
  vibes: number;
  specials: number;
  familyMessages: number;
  totalMemories: number;
}
