import { NextResponse } from "next/server";
import { requireSession, writeAudit } from "@/lib/auth/session";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { getTrustedUnlockState } from "@/lib/time/serverTime";
import { canReadSealedMemoryContent, canReadFamilyMessage } from "@/lib/security/permissions";
import { AppError, toUserMessage } from "@/lib/errors";
import { serializeValue, withSignedMedia } from "@/lib/storage/signedMedia";
import type { StorageFileRef } from "@/types/models";

async function presentDoc(id: string, data: Record<string, unknown>, includeMedia: boolean) {
  const serialized = serializeValue({ id, ...data }) as Record<string, unknown> & {
    storagePaths?: StorageFileRef[];
  };
  if (!includeMedia) {
    delete serialized.content;
    delete serialized.vibe;
    delete serialized.storagePaths;
    return serialized;
  }
  return withSignedMedia(serialized);
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    if (!isAdminConfigured()) {
      return NextResponse.json({ error: "The vault backend is not configured yet." }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind");
    const id = searchParams.get("id");
    if (!kind) {
      return NextResponse.json({ error: "Missing request type." }, { status: 400 });
    }
    if ((kind === "memory" || kind === "family") && !id) {
      return NextResponse.json({ error: "Missing item ID." }, { status: 400 });
    }

    const time = await getTrustedUnlockState(session.capsuleId);
    const ctx = {
      role: session.role,
      userId: session.uid,
      capsuleId: session.capsuleId,
      isUnlocked: time.isUnlocked,
    };

    if (kind === "memory") {
      if (!canReadSealedMemoryContent(ctx)) {
        await writeAudit({
          capsuleId: session.capsuleId,
          actorId: session.uid,
          actorRole: session.role,
          action: "permission_denied",
          targetType: "memory",
          targetId: id,
        });
        return NextResponse.json(
          { error: "Nice try! The vault is still sealed. 😉✨", sealed: true },
          { status: 403 },
        );
      }
      const snap = await adminDb().doc(`capsules/${session.capsuleId}/memories/${id}`).get();
      if (!snap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json({
        item: await presentDoc(snap.id, (snap.data() ?? {}) as Record<string, unknown>, true),
        isUnlocked: true,
      });
    }

    if (kind === "family") {
      const snap = await adminDb().doc(`capsules/${session.capsuleId}/familyMessages/${id}`).get();
      if (!snap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const data = snap.data() ?? {};
      if (!canReadFamilyMessage(ctx, String(data.authorId))) {
        await writeAudit({
          capsuleId: session.capsuleId,
          actorId: session.uid,
          actorRole: session.role,
          action: "permission_denied",
          targetType: "family",
          targetId: id,
        });
        return NextResponse.json(
          { error: "Nice try! The vault is still sealed. 😉✨", sealed: true },
          { status: 403 },
        );
      }
      return NextResponse.json({
        item: await presentDoc(snap.id, data as Record<string, unknown>, true),
        isUnlocked: time.isUnlocked,
      });
    }

    if (kind === "own-family-feed") {
      if (session.role !== "family" && session.role !== "admin") {
        return NextResponse.json({ error: "Family Corner is for family members." }, { status: 403 });
      }
      let familyDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
      try {
        const snap = await adminDb()
          .collection(`capsules/${session.capsuleId}/familyMessages`)
          .where("authorId", "==", session.uid)
          .orderBy("createdAt", "desc")
          .limit(40)
          .get();
        familyDocs = snap.docs;
      } catch {
        // Fallback in case Firestore composite index is still building or not yet deployed
        const snap = await adminDb()
          .collection(`capsules/${session.capsuleId}/familyMessages`)
          .where("authorId", "==", session.uid)
          .limit(40)
          .get();
        familyDocs = snap.docs.slice().sort((a, b) => {
          const aData = a.data();
          const bData = b.data();
          const aTime = aData.createdAt?.toMillis ? aData.createdAt.toMillis() : new Date(aData.createdAt ?? 0).getTime();
          const bTime = bData.createdAt?.toMillis ? bData.createdAt.toMillis() : new Date(bData.createdAt ?? 0).getTime();
          return bTime - aTime;
        });
      }

      const familyMessages = await Promise.all(
        familyDocs.map((docSnap) => presentDoc(docSnap.id, docSnap.data() as Record<string, unknown>, true)),
      );
      return NextResponse.json({ familyMessages });
    }

    if (kind === "unlocked-feed") {
      if (!time.isUnlocked && session.role !== "admin") {
        return NextResponse.json({ error: "The vault is still sealed.", sealed: true }, { status: 403 });
      }
      let memoriesDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
      try {
        const memories = await adminDb()
          .collection(`capsules/${session.capsuleId}/memories`)
          .orderBy("createdAt", "desc")
          .limit(40)
          .get();
        memoriesDocs = memories.docs;
      } catch {
        const memories = await adminDb()
          .collection(`capsules/${session.capsuleId}/memories`)
          .limit(40)
          .get();
        memoriesDocs = memories.docs.slice().sort((a, b) => {
          const aData = a.data();
          const bData = b.data();
          const aTime = aData.createdAt?.toMillis ? aData.createdAt.toMillis() : new Date(aData.createdAt ?? 0).getTime();
          const bTime = bData.createdAt?.toMillis ? bData.createdAt.toMillis() : new Date(bData.createdAt ?? 0).getTime();
          return bTime - aTime;
        });
      }

      let familyDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
      try {
        const family = await adminDb()
          .collection(`capsules/${session.capsuleId}/familyMessages`)
          .orderBy("createdAt", "desc")
          .limit(40)
          .get();
        familyDocs = family.docs;
      } catch {
        const family = await adminDb()
          .collection(`capsules/${session.capsuleId}/familyMessages`)
          .limit(40)
          .get();
        familyDocs = family.docs.slice().sort((a, b) => {
          const aData = a.data();
          const bData = b.data();
          const aTime = aData.createdAt?.toMillis ? aData.createdAt.toMillis() : new Date(aData.createdAt ?? 0).getTime();
          const bTime = bData.createdAt?.toMillis ? bData.createdAt.toMillis() : new Date(bData.createdAt ?? 0).getTime();
          return bTime - aTime;
        });
      }

      return NextResponse.json({
        memories: await Promise.all(
          memoriesDocs.map((docSnap) => presentDoc(docSnap.id, docSnap.data() as Record<string, unknown>, true)),
        ),
        familyMessages: await Promise.all(
          familyDocs.map((docSnap) => presentDoc(docSnap.id, docSnap.data() as Record<string, unknown>, true)),
        ),
      });
    }

    return NextResponse.json({ error: "Unknown request." }, { status: 400 });
  } catch (error) {
    console.error("Vault content API error:", error);
    let status = 400;
    if (error instanceof AppError) {
      if (error.code === "unauthenticated") status = 401;
      else if (error.code === "permission_denied") status = 403;
      else if (error.code === "unavailable") status = 503;
    }
    return NextResponse.json({ error: toUserMessage(error) }, { status });
  }
}
