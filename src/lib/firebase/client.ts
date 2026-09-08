"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

let appCheckStarted = false;

function requiredClientConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "placeholder-api-key",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "localhost",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "placeholder-project",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "placeholder.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "0000000000",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:0000000000:web:0000000000",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  return config;
}

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length) return getApp();
  return initializeApp(requiredClientConfig());
}

export function startAppCheck(app: FirebaseApp) {
  if (appCheckStarted || typeof window === "undefined") return;
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY;
  if (!siteKey) return;
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  appCheckStarted = true;
}

export function getClientAuth(): Auth {
  const app = getFirebaseApp();
  startAppCheck(app);
  return getAuth(app);
}

export function getClientDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getClientStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "placeholder-api-key",
  );
}
