import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch,
  where,
  type Firestore,
} from "firebase/firestore";
import type {
  FamilyMessage,
  FamilyMessageIndex,
  Memory,
  MemoryIndex,
  MemoryType,
  UserRole,
  VaultPreviewCounts,
} from "@/types/models";

export function memoryIndexCollection(db: Firestore, capsuleId: string) {
  return collection(db, "capsules", capsuleId, "memoryIndex");
}

export function memoriesCollection(db: Firestore, capsuleId: string) {
  return collection(db, "capsules", capsuleId, "memories");
}

export function familyIndexCollection(db: Firestore, capsuleId: string) {
  return collection(db, "capsules", capsuleId, "familyIndex");
}

export function familyMessagesCollection(db: Firestore, capsuleId: string) {
  return collection(db, "capsules", capsuleId, "familyMessages");
}

export async function sealMemory(options: {
  db: Firestore;
  capsuleId: string;
  authorId: string;
  authorRole: UserRole;
  unlockAt: string;
  memoryId?: string;
  memory: Omit<Memory, "id" | "createdAt" | "updatedAt" | "isLocked" | "status" | "capsuleId" | "authorId" | "authorRole" | "unlockAt">;
}) {
  const memoryRef = options.memoryId
    ? doc(memoriesCollection(options.db, options.capsuleId), options.memoryId)
    : doc(memoriesCollection(options.db, options.capsuleId));
  const payload = {
    ...options.memory,
    capsuleId: options.capsuleId,
    authorId: options.authorId,
    authorRole: options.authorRole,
    unlockAt: options.unlockAt,
    isLocked: true,
    status: "sealed",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const index: Omit<MemoryIndex, "createdAt"> & { createdAt: unknown } = {
    id: memoryRef.id,
    capsuleId: options.capsuleId,
    authorId: options.authorId,
    authorRole: options.authorRole,
    type: options.memory.type,
    status: "sealed",
    mediaCount: options.memory.storagePaths.filter((f) => f.contentType.startsWith("image/")).length,
    hasAudio: options.memory.storagePaths.some((f) => f.contentType.startsWith("audio/")),
    createdAt: serverTimestamp(),
  };
  const batch = writeBatch(options.db);
  batch.set(memoryRef, {
    ...payload,
    unlockAt: Timestamp.fromDate(new Date(options.unlockAt)),
  });
  batch.set(doc(memoryIndexCollection(options.db, options.capsuleId), memoryRef.id), index);
  await batch.commit();
  return memoryRef.id;
}

export async function sealFamilyMessage(options: {
  db: Firestore;
  capsuleId: string;
  authorId: string;
  authorRole: UserRole;
  unlockAt: string;
  messageId?: string;
  message: Omit<FamilyMessage, "id" | "createdAt" | "updatedAt" | "isLocked" | "status" | "capsuleId" | "authorId" | "authorRole" | "unlockAt">;
}) {
  const ref = options.messageId
    ? doc(familyMessagesCollection(options.db, options.capsuleId), options.messageId)
    : doc(familyMessagesCollection(options.db, options.capsuleId));
  const batch = writeBatch(options.db);
  batch.set(ref, {
    ...options.message,
    capsuleId: options.capsuleId,
    authorId: options.authorId,
    authorRole: options.authorRole,
    unlockAt: Timestamp.fromDate(new Date(options.unlockAt)),
    isLocked: true,
    status: "sealed",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(familyIndexCollection(options.db, options.capsuleId), ref.id), {
    id: ref.id,
    capsuleId: options.capsuleId,
    authorId: options.authorId,
    authorRole: options.authorRole,
    type: options.message.type,
    mediaCount: options.message.storagePaths.filter((f) => f.contentType.startsWith("image/")).length,
    hasAudio: options.message.storagePaths.some((f) => f.contentType.startsWith("audio/")),
    createdAt: serverTimestamp(),
  } satisfies Omit<FamilyMessageIndex, "createdAt"> & { createdAt: unknown });
  await batch.commit();
  return ref.id;
}

export async function listOwnFamilyIndex(db: Firestore, capsuleId: string, authorId: string) {
  const q = query(
    familyIndexCollection(db, capsuleId),
    where("authorId", "==", authorId),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((item) => item.data() as FamilyMessageIndex);
}

export async function listMemoryIndex(db: Firestore, capsuleId: string) {
  const q = query(memoryIndexCollection(db, capsuleId), orderBy("createdAt", "desc"), limit(40));
  const snap = await getDocs(q);
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as MemoryIndex);
}

export async function previewCounts(db: Firestore, capsuleId: string): Promise<VaultPreviewCounts> {
  const index = memoryIndexCollection(db, capsuleId);
  const family = familyIndexCollection(db, capsuleId);

  const countType = async (type: MemoryType) => {
    const snap = await getCountFromServer(query(index, where("type", "==", type)));
    return snap.data().count;
  };

  const [letters, photos, voices, vibes, specials, familyMessages, totalMemories] = await Promise.all([
    countType("letter"),
    countType("photo"),
    countType("voice"),
    countType("vibe"),
    countType("special"),
    getCountFromServer(family).then((s) => s.data().count),
    getCountFromServer(index).then((s) => s.data().count),
  ]);

  return { letters, photos, voices, vibes, specials, familyMessages, totalMemories };
}

export async function deleteOwnIndex(
  db: Firestore,
  capsuleId: string,
  kind: "memory" | "family",
  id: string,
) {
  const batch = writeBatch(db);
  if (kind === "memory") {
    batch.delete(doc(memoryIndexCollection(db, capsuleId), id));
    batch.delete(doc(memoriesCollection(db, capsuleId), id));
  } else {
    batch.delete(doc(familyIndexCollection(db, capsuleId), id));
    batch.delete(doc(familyMessagesCollection(db, capsuleId), id));
  }
  await batch.commit();
}
