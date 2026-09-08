import { Timestamp } from "firebase-admin/firestore";
import { adminBucket, isAdminConfigured } from "@/lib/firebase/admin";
import type { StorageFileRef } from "@/types/models";

export function serializeValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, serializeValue(nested)]));
  }
  return value;
}

export async function withSignedMedia<T extends { storagePaths?: StorageFileRef[] }>(item: T): Promise<T & { media: Array<StorageFileRef & { url: string }> }> {
  const paths = item.storagePaths ?? [];
  if (!paths.length || !isAdminConfigured() || !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    return { ...item, media: [] };
  }

  try {
    const bucket = adminBucket();
    const media = await Promise.all(
      paths.map(async (file) => {
        try {
          const [url] = await bucket.file(file.path).getSignedUrl({
            action: "read",
            expires: Date.now() + 10 * 60 * 1000,
          });
          return { ...file, url };
        } catch {
          return { ...file, url: "" };
        }
      }),
    );

    return { ...item, media: media.filter((file) => file.url) };
  } catch (err) {
    console.error("Failed to generate signed media URLs:", err);
    return { ...item, media: [] };
  }
}
