import { describe, expect, it } from "vitest";
import { roleForEmail } from "@/lib/auth/roles";
import { memoryDraftSchema } from "@/lib/validation/schemas";

describe("role assignment", () => {
  it("maps emails to roles and rejects strangers", () => {
    const opts = {
      adminEmails: "admin@family.test",
      recipientEmail: "yana@family.test",
      familyEmails: "tito@family.test",
    };
    expect(roleForEmail("admin@family.test", opts)).toBe("admin");
    expect(roleForEmail("yana@family.test", opts)).toBe("recipient");
    expect(roleForEmail("tito@family.test", opts)).toBe("family");
    expect(roleForEmail("cousin@family.test", { ...opts, extraFamily: ["cousin@family.test"] })).toBe("family");
    expect(roleForEmail("stranger@example.com", opts)).toBeNull();
  });
});

describe("memory creation payload", () => {
  it("accepts a sealed letter and rejects empty titles", () => {
    const ok = memoryDraftSchema.safeParse({
      type: "letter",
      title: "For 18-year-old me",
      content: "Keep the soft parts.",
    });
    expect(ok.success).toBe(true);
    const bad = memoryDraftSchema.safeParse({ type: "letter", title: " " });
    expect(bad.success).toBe(false);
  });
});
