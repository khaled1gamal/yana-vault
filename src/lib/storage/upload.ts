import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type FirebaseStorage,
  type UploadTask,
} from "firebase/storage";
import type { StorageFileRef } from "@/types/models";

export interface UploadHandle {
  task: UploadTask;
  promise: Promise<StorageFileRef>;
  cancel: () => void;
}

export function storagePath(parts: {
  capsuleId: string;
  userId: string;
  folder: "memories" | "family";
  itemId: string;
  kind: "photos" | "audio";
  fileId: string;
}) {
  return `capsules/${parts.capsuleId}/users/${parts.userId}/${parts.folder}/${parts.itemId}/${parts.kind}/${parts.fileId}`;
}

export function uploadFile(options: {
  storage: FirebaseStorage;
  path: string;
  file: Blob;
  contentType: string;
  onProgress?: (pct: number) => void;
}): UploadHandle {
  const cleanContentType = (options.contentType || "application/octet-stream").split(";")[0].trim().toLowerCase();
  const objectRef = ref(options.storage, options.path);
  const task = uploadBytesResumable(objectRef, options.file, {
    contentType: cleanContentType,
    cacheControl: "private, max-age=0, no-store",
  });

  const promise = new Promise<StorageFileRef>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        const pct = snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0;
        options.onProgress?.(pct);
      },
      (error) => reject(error),
      async () => {
        resolve({
          path: options.path,
          contentType: options.contentType,
          size: options.file.size,
          fileId: options.path.split("/").pop() || crypto.randomUUID(),
        });
      },
    );
  });

  return {
    task,
    promise,
    cancel: () => task.cancel(),
  };
}

export async function removeFile(storage: FirebaseStorage, path: string) {
  await deleteObject(ref(storage, path));
}

export async function downloadUrl(storage: FirebaseStorage, path: string) {
  return getDownloadURL(ref(storage, path));
}

export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type.includes("heic") || file.type.includes("heif")) {
    return file;
  }
  if (file.size < 1.2 * 1024 * 1024) return file;
  const { default: imageCompression } = await import("browser-image-compression");
  return imageCompression(file, {
    maxSizeMB: 1.2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
}
