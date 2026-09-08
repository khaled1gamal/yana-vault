import { describe, expect, it } from "vitest";
import {
  capsuleConfigUpdateSchema,
  familyDraftSchema,
  memoryDraftSchema,
  validateAudioFile,
  validateImageFile,
  validateRecordingDuration,
} from "@/lib/validation/schemas";

describe("file validation", () => {
  it("rejects executables and oversized images", () => {
    expect(validateImageFile({ type: "application/x-msdownload", size: 100 })).toBeTruthy();
    expect(validateImageFile({ type: "image/jpeg", size: 80 * 1024 * 1024 })).toBeTruthy();
    expect(validateImageFile({ type: "image/jpeg", size: 1200 })).toBeNull();
  });

  it("allows configured audio types only", () => {
    expect(validateAudioFile({ type: "audio/webm", size: 1000 })).toBeNull();
    expect(validateAudioFile({ type: "application/javascript", size: 1000 })).toBeTruthy();
  });

  it("enforces recording duration", () => {
    expect(validateRecordingDuration(0)).toBeTruthy();
    expect(validateRecordingDuration(12)).toBeNull();
    expect(validateRecordingDuration(400)).toBeTruthy();
  });
});

describe("capsuleConfigUpdateSchema", () => {
  const validConfig = {
    title: "Yana's Time Capsule",
    recipientName: "Yana",
    birthDate: "2011-01-01",
    timezone: "Asia/Manila",
    welcomeMessage: "Welcome to your 18th birthday vault.",
    theme: "midnight-lilac",
    status: "active",
    maxImageBytes: 8388608,
    maxAudioBytes: 10485760,
    maxRecordingSeconds: 90,
    familyEmails: ["family@example.com"],
  };

  it("validates a correct configuration", () => {
    const result = capsuleConfigUpdateSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("accepts different valid timezones", () => {
    const result = capsuleConfigUpdateSchema.safeParse({ ...validConfig, timezone: "Asia/Riyadh" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid birthDate format", () => {
    const result = capsuleConfigUpdateSchema.safeParse({ ...validConfig, birthDate: "01-01-2011" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid family emails", () => {
    const result = capsuleConfigUpdateSchema.safeParse({ ...validConfig, familyEmails: ["not-an-email"] });
    expect(result.success).toBe(false);
  });

  it("rejects out of bounds byte limits and recording seconds", () => {
    expect(capsuleConfigUpdateSchema.safeParse({ ...validConfig, maxImageBytes: 50 }).success).toBe(false);
    expect(capsuleConfigUpdateSchema.safeParse({ ...validConfig, maxRecordingSeconds: 2 }).success).toBe(false);
  });
});

describe("memoryDraftSchema & familyDraftSchema", () => {
  it("validates a valid letter memory draft", () => {
    const draft = {
      type: "letter",
      title: "Dear 18-year-old self",
      content: "Never forget where you started.",
      caption: "A quiet moment",
      mood: "reflective",
      tags: ["future", "letter"],
      vibe: null,
    };
    const res = memoryDraftSchema.safeParse(draft);
    expect(res.success).toBe(true);
  });

  it("validates a vibe check memory draft", () => {
    const vibeDraft = {
      type: "vibe",
      title: "Current Vibe Check 2026",
      content: "",
      caption: "My life in 2026",
      mood: "slay",
      tags: ["vibes", "2026"],
      vibe: {
        favoriteSpotifySong: "Super Shy - NewJeans",
        favoriteKpopArtist: "NewJeans",
        favoriteAnime: "Frieren",
        favoriteCelebrity: "IU",
        bestFriends: "Chloe & Maya",
        favoriteFood: "Sinigang",
        favoriteColor: "Lilac Lavender",
        currentAesthetic: "Coquette Soft Glow",
        currentMood: "Hopeful & Happy",
        favoriteQuote: "Bloom where you are planted",
        currentDream: "Architect & Artist",
        whatILoveRightNow: "Journaling and iced matcha",
        whatIWantToChange: "Procrastination",
        whatIHopeFutureRemembers: "How hard we worked and how much we laughed",
      },
    };
    const res = memoryDraftSchema.safeParse(vibeDraft);
    expect(res.success).toBe(true);
  });

  it("rejects empty memory title", () => {
    const invalid = {
      type: "letter",
      title: "   ",
      content: "Hello",
    };
    const res = memoryDraftSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("validates a family draft", () => {
    const familyDraft = {
      type: "birthday",
      title: "Happy 18th Birthday Yana!",
      content: "We are so proud of the woman you have become.",
      caption: "From Mom & Dad",
    };
    const res = familyDraftSchema.safeParse(familyDraft);
    expect(res.success).toBe(true);
  });

  it("rejects invalid family message types", () => {
    const invalidType = {
      type: "invalid_type",
      title: "Hello",
      content: "World",
    };
    const res = familyDraftSchema.safeParse(invalidType);
    expect(res.success).toBe(false);
  });
});

