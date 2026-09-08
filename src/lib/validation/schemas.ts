import { z } from "zod";
import {
  ALLOWED_AUDIO_MIME,
  ALLOWED_IMAGE_MIME,
  BODY_MAX,
  DEFAULT_MAX_AUDIO_BYTES,
  DEFAULT_MAX_IMAGE_BYTES,
  DEFAULT_MAX_RECORDING_SECONDS,
  DEFAULT_TIMEZONE,
  FAMILY_MESSAGE_TYPES,
  MEMORY_TYPES,
  TAG_MAX,
  TAGS_MAX,
  TITLE_MAX,
} from "@/constants/capsule";

export const roleSchema = z.enum(["admin", "family", "recipient"]);

export const vibeSchema = z.object({
  favoriteSpotifySong: z.string().trim().max(160),
  favoriteKpopArtist: z.string().trim().max(120),
  favoriteAnime: z.string().trim().max(120),
  favoriteCelebrity: z.string().trim().max(120),
  bestFriends: z.string().trim().max(240),
  favoriteFood: z.string().trim().max(120),
  favoriteColor: z.string().trim().max(80),
  currentAesthetic: z.string().trim().max(120),
  currentMood: z.string().trim().max(80),
  favoriteQuote: z.string().trim().max(280),
  currentDream: z.string().trim().max(400),
  whatILoveRightNow: z.string().trim().max(400),
  whatIWantToChange: z.string().trim().max(400),
  whatIHopeFutureRemembers: z.string().trim().max(400),
});

export const memoryDraftSchema = z.object({
  type: z.enum(MEMORY_TYPES),
  title: z.string().trim().min(1).max(TITLE_MAX),
  content: z.string().trim().max(BODY_MAX).default(""),
  caption: z.string().trim().max(280).default(""),
  mood: z.string().trim().max(40).default(""),
  tags: z.array(z.string().trim().min(1).max(TAG_MAX)).max(TAGS_MAX).default([]),
  vibe: vibeSchema.nullable().default(null),
});

export const familyDraftSchema = z.object({
  type: z.enum(FAMILY_MESSAGE_TYPES),
  title: z.string().trim().min(1).max(TITLE_MAX),
  content: z.string().trim().max(BODY_MAX).default(""),
  caption: z.string().trim().max(280).default(""),
});

export const capsuleConfigUpdateSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").max(80, "Title is too long (max 80 chars)"),
  recipientName: z.string().trim().min(1, "Recipient name cannot be empty").max(80, "Recipient name is too long (max 80 chars)"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Birth date must be in YYYY-MM-DD format"),
  timezone: z.string().trim().min(1, "Timezone is required").max(100).default(DEFAULT_TIMEZONE),
  welcomeMessage: z.string().trim().min(1, "Welcome message cannot be empty").max(400, "Welcome message is too long (max 400 chars)"),
  theme: z.string().trim().min(1).max(50).default("midnight-lilac"),
  status: z.enum(["active", "paused", "archived"]),
  maxImageBytes: z.coerce.number().int().min(1024, "Max image bytes must be at least 1024 (1 KB)").max(20 * 1024 * 1024, "Max image bytes cannot exceed 20MB"),
  maxAudioBytes: z.coerce.number().int().min(1024, "Max audio bytes must be at least 1024 (1 KB)").max(25 * 1024 * 1024, "Max audio bytes cannot exceed 25MB"),
  maxRecordingSeconds: z.coerce.number().int().min(5, "Max recording seconds must be at least 5").max(300, "Max recording seconds cannot exceed 300"),
  familyEmails: z.array(z.string().trim().email("Invalid family email address")).max(40, "Max 40 family emails"),
  confirmUnlockChange: z.boolean().optional(),
});

export function validateImageFile(
  file: { type: string; size: number },
  maxBytes = DEFAULT_MAX_IMAGE_BYTES,
) {
  const mime = (file.type || "").split(";")[0].trim().toLowerCase();
  if (!ALLOWED_IMAGE_MIME.includes(mime as (typeof ALLOWED_IMAGE_MIME)[number])) {
    return "That image type is not allowed. Use JPEG, PNG, WEBP, or HEIC.";
  }
  if (file.size > maxBytes) {
    return `Images must be smaller than ${Math.round(maxBytes / (1024 * 1024))}MB.`;
  }
  return null;
}

export function validateAudioFile(
  file: { type: string; size: number },
  maxBytes = DEFAULT_MAX_AUDIO_BYTES,
) {
  const mime = (file.type || "").split(";")[0].trim().toLowerCase();
  if (!ALLOWED_AUDIO_MIME.includes(mime as (typeof ALLOWED_AUDIO_MIME)[number])) {
    return "That audio type is not allowed.";
  }
  if (file.size > maxBytes) {
    return `Audio must be smaller than ${Math.round(maxBytes / (1024 * 1024))}MB.`;
  }
  return null;
}

export function validateRecordingDuration(
  seconds: number,
  max = DEFAULT_MAX_RECORDING_SECONDS,
) {
  if (seconds <= 0) return "Recording is empty.";
  if (seconds > max) return `Keep it under ${max} seconds — a short time-capsule note.`;
  return null;
}
