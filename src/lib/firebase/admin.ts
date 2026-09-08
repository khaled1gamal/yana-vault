import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function readPrivateKey(): string | undefined {
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!raw) return undefined;
  return raw.replace(/\\n/g, "\n");
}

export function isAdminConfigured(): boolean {
  if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    return true;
  }
  return Boolean(
    (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID) &&
      (process.env.K_SERVICE || process.env.FIREBASE_CONFIG || process.env.GCLOUD_PROJECT),
  );
}

export function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;

  const privateKey = readPrivateKey();
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  return initializeApp({
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function adminBucket() {
  return getStorage(getAdminApp()).bucket();
}
