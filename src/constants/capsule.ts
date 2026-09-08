export const DEFAULT_TIMEZONE = "Asia/Manila" as const;
export const UNLOCK_AGE_YEARS = 18;
export const SESSION_COOKIE_NAME = "__session";

export const MEMORY_TYPES = [
  "letter",
  "photo",
  "voice",
  "vibe",
  "special",
] as const;

export const FAMILY_MESSAGE_TYPES = [
  "birthday",
  "letter",
  "photo",
  "voice",
  "wish",
  "advice",
] as const;

export const ALLOWED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const ALLOWED_AUDIO_MIME = [
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "audio/x-m4a",
] as const;

export const DEFAULT_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const DEFAULT_MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const DEFAULT_MAX_RECORDING_SECONDS = 90;
export const DEFAULT_MAX_PHOTOS_PER_MEMORY = 12;

export const TITLE_MAX = 80;
export const BODY_MAX = 8000;
export const TAG_MAX = 24;
export const TAGS_MAX = 8;

export function publicCapsuleId(): string {
  return process.env.NEXT_PUBLIC_CAPSULE_ID || "yana-vault";
}

export function publicRecipientName(): string {
  return process.env.NEXT_PUBLIC_RECIPIENT_FIRST_NAME || "Yana";
}
