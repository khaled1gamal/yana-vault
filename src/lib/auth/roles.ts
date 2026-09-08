import type { UserRole } from "@/types/models";

function parseEmailList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function roleForEmail(
  email: string,
  options: { adminEmails?: string; recipientEmail?: string; familyEmails?: string; extraFamily?: string[] } = {},
): UserRole | null {
  const normalized = email.toLowerCase();
  if (parseEmailList(options.adminEmails).includes(normalized)) return "admin";
  if (parseEmailList(options.recipientEmail).includes(normalized)) return "recipient";
  const extras = (options.extraFamily ?? []).map((item) => item.toLowerCase());
  if (parseEmailList(options.familyEmails).includes(normalized) || extras.includes(normalized)) {
    return "family";
  }
  return null;
}

export function envRoleForEmail(email: string, extraFamily: string[] = []): UserRole | null {
  return roleForEmail(email, {
    adminEmails: process.env.ADMIN_EMAILS,
    recipientEmail: process.env.RECIPIENT_EMAIL,
    familyEmails: process.env.FAMILY_EMAILS,
    extraFamily,
  });
}
