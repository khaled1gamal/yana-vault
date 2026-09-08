"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getClientAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { toUserMessage } from "@/lib/errors";
import type { ServerTimePayload } from "@/types/models";
import type { UserRole } from "@/types/models";

export interface VaultSession extends ServerTimePayload {
  role: UserRole;
  uid: string;
  email: string;
  capsuleId: string;
  decisionSource: "server";
}

interface AuthState {
  firebaseUser: User | null;
  session: VaultSession | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signInEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<VaultSession | null>;
}

const AuthContext = createContext<AuthState | null>(null);

async function readApiError(response: Response, fallback: string) {
  const json = (await response.json().catch(() => null)) as { error?: string } | null;
  return json?.error || fallback;
}

let sessionPromise: Promise<VaultSession> | null = null;

async function establishSession(user: User): Promise<VaultSession> {
  if (sessionPromise) return sessionPromise;

  sessionPromise = (async (): Promise<VaultSession> => {
    try {
      const token = await user.getIdToken();
      const bootstrap = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token, step: "bootstrap" }),
      });
      if (!bootstrap.ok) {
        throw new Error(await readApiError(bootstrap, "Could not enter the vault."));
      }

      // Firebase custom claims (role, capsuleId) are set by bootstrapUser on the server.
      // They need time to propagate back to the client SDK — a single getIdTokenResult(true)
      // called right after setCustomUserClaims can still return the old token.
      // Retry with a short delay until the claims appear (max 5 attempts × 600 ms).
      let refreshed: string | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 600));
        try {
          const tokenResult = await user.getIdTokenResult(true);
          if (tokenResult.claims.role && tokenResult.claims.capsuleId) {
            refreshed = tokenResult.token;
            break;
          }
        } catch {
          // Token refresh failure — keep retrying
        }
      }
      if (!refreshed) {
        throw new Error("Your account claims could not be confirmed. Please try again.");
      }

      const cookieRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: refreshed, step: "cookie" }),
      });
      if (!cookieRes.ok) {
        throw new Error(await readApiError(cookieRes, "Could not save your session."));
      }

      const timeRes = await fetch("/api/time", { cache: "no-store" });
      if (!timeRes.ok) {
        throw new Error(await readApiError(timeRes, "Could not read trusted vault time."));
      }
      const timeJson = await timeRes.json();
      if (!timeJson.role || !timeJson.capsuleId) {
        throw new Error("Could not verify active session claims.");
      }
      return timeJson as VaultSession;
    } finally {
      sessionPromise = null;
    }
  })();

  return sessionPromise;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<VaultSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/time", { cache: "no-store" });
      if (!res.ok) {
        setSession(null);
        return null;
      }
      const json = await res.json();
      if (!json.role || !json.capsuleId) {
        setSession(null);
        return null;
      }
      setSession(json as VaultSession);
      return json as VaultSession;
    } catch {
      setSession(null);
      return null;
    }
  };

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const auth = getClientAuth();

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const current = await refreshSession();
          if (!current) {
            const established = await establishSession(user);
            setSession(established);
          }
        } catch (err) {
          setError(toUserMessage(err));
          setSession(null);
          await signOut(auth).catch(() => undefined);
        }
      } else {
        setSession(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [configured]);

  const value = useMemo<AuthState>(
    () => ({
      firebaseUser,
      session,
      loading,
      configured,
      error,
      refreshSession,
      signInEmail: async (email, password) => {
        setError(null);
        const auth = getClientAuth();
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const s = await establishSession(cred.user);
        setSession(s);
      },
      registerEmail: async (email, password) => {
        setError(null);
        const auth = getClientAuth();
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        try {
          const s = await establishSession(cred.user);
          setSession(s);
        } catch (err) {
          await signOut(auth).catch(() => undefined);
          throw err;
        }
      },
      signInGoogle: async () => {
        setError(null);
        const auth = getClientAuth();
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        const cred = await signInWithPopup(auth, provider);
        try {
          const s = await establishSession(cred.user);
          setSession(s);
        } catch (err) {
          await signOut(auth).catch(() => undefined);
          throw err;
        }
      },
      logout: async () => {
        await fetch("/api/auth/session", { method: "DELETE" });
        if (configured) await signOut(getClientAuth());
        setSession(null);
      },
    }),
    [configured, error, firebaseUser, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
