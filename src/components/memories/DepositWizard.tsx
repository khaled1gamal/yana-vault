"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, GhostButton, GlassCard, PrimaryButton, TextArea, TextInput } from "@/components/ui/Primitives";
import { PhotoUploader, type LocalPhoto } from "@/components/upload/PhotoUploader";
import { VoiceRecorder } from "@/components/upload/VoiceRecorder";
import { memoryDraftSchema, vibeSchema } from "@/lib/validation/schemas";
import { useAuth } from "@/components/providers/AuthProvider";
import { getClientDb, getClientStorage, isFirebaseConfigured } from "@/lib/firebase/client";
import { sealMemory } from "@/services/capsule";
import { storagePath, uploadFile } from "@/lib/storage/upload";
import { toUserMessage } from "@/lib/errors";
import { useToast } from "@/components/ui/Toast";
import type { FamilyMessageType, MemoryType, VibeCheck } from "@/types/models";
import { useReducedMotion } from "framer-motion";

const types: { id: MemoryType; label: string; blurb: string }[] = [
  { id: "letter", label: "Letter", blurb: "A note for 18-year-old you." },
  { id: "photo", label: "Photo", blurb: "Soft-glow proof you were here." },
  { id: "voice", label: "Voice", blurb: "Your laugh, sealed." },
  { id: "vibe", label: "Vibe Check", blurb: "Current Vibe Check 2026." },
  { id: "special", label: "Special Memory", blurb: "The kakaiba ones." },
];

const familyTypes: { id: FamilyMessageType; label: string; blurb: string }[] = [
  { id: "birthday", label: "Birthday message", blurb: "For the morning she turns 18." },
  { id: "letter", label: "Letter", blurb: "A family letter she can’t open yet." },
  { id: "photo", label: "Photo memory", blurb: "A still she hasn’t seen." },
  { id: "voice", label: "Voice message", blurb: "Say it out loud." },
  { id: "wish", label: "Wish", blurb: "Soft hopes, sealed." },
  { id: "advice", label: "Advice", blurb: "For the woman she’s becoming." },
];

const emptyVibe: VibeCheck = {
  favoriteSpotifySong: "",
  favoriteKpopArtist: "",
  favoriteAnime: "",
  favoriteCelebrity: "",
  bestFriends: "",
  favoriteFood: "",
  favoriteColor: "",
  currentAesthetic: "",
  currentMood: "",
  favoriteQuote: "",
  currentDream: "",
  whatILoveRightNow: "",
  whatIWantToChange: "",
  whatIHopeFutureRemembers: "",
};

export function DepositWizard({
  family = false,
  initialType,
  initialStep = 1,
}: {
  family?: boolean;
  initialType?: MemoryType | FamilyMessageType;
  initialStep?: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const reduce = useReducedMotion();
  const { session } = useAuth();
  const [step, setStep] = useState(initialStep);
  const [type, setType] = useState<MemoryType | FamilyMessageType>(
    initialType ?? (family ? "birthday" : "letter"),
  );
  const picker = family ? familyTypes : types;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("soft");
  const [tags, setTags] = useState("");
  const [caption, setCaption] = useState("");
  const [vibe, setVibe] = useState<VibeCheck>(emptyVibe);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUse = session && (family ? session.role === "family" || session.role === "admin" : session.role === "recipient" || session.role === "admin");

  const preview = useMemo(
    () => ({ type, title, content, mood, tags, vibe, photos: photos.length, hasAudio: Boolean(audio) }),
    [type, title, content, mood, tags, vibe, photos.length, audio],
  );

  function validateStep(currentStep: number): boolean {
    setError(null);
    if (currentStep === 1) {
      if (!type) {
        setError("Please choose a memory type.");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!title.trim()) {
        setError("Please enter a title for this memory.");
        return false;
      }
      if (type === "vibe") {
        const vibeParsed = vibeSchema.safeParse(vibe);
        if (!vibeParsed.success) {
          setError("Please complete the required vibe check fields.");
          return false;
        }
      }
    }
    return true;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, 5));
  }

  async function save() {
    if (!session || !isFirebaseConfigured()) {
      setError("Firebase is not configured on this device yet.");
      return;
    }
    if (!title.trim()) {
      setError("Please provide a title before sealing.");
      return;
    }
    if (!family) {
      const parsed = memoryDraftSchema.safeParse({
        type,
        title,
        content,
        caption,
        mood,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        vibe: type === "vibe" ? vibe : null,
      });
      if (!parsed.success) {
        setError("Please complete the required fields.");
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const db = getClientDb();
      const storage = getClientStorage();
      const itemId = crypto.randomUUID();
      const storagePaths = [];
      let uploaded = 0;
      const files: { file: Blob; kind: "photos" | "audio"; type: string }[] = [
        ...photos.map((p) => ({ file: p.file, kind: "photos" as const, type: p.file.type })),
      ];
      if (audio) files.push({ file: audio, kind: "audio", type: audio.type || "audio/webm" });

      for (const item of files) {
        const fileId = crypto.randomUUID();
        const path = storagePath({
          capsuleId: session.capsuleId,
          userId: session.uid,
          folder: family ? "family" : "memories",
          itemId,
          kind: item.kind,
          fileId,
        });
        const handle = uploadFile({
          storage,
          path,
          file: item.file,
          contentType: item.type,
          onProgress: (pct) => setProgress(Math.round(((uploaded + pct / 100) / Math.max(files.length, 1)) * 100)),
        });
        storagePaths.push(await handle.promise);
        uploaded += 1;
        setProgress(Math.round((uploaded / Math.max(files.length, 1)) * 100));
      }

      if (family) {
        const { sealFamilyMessage } = await import("@/services/capsule");
        await sealFamilyMessage({
          db,
          capsuleId: session.capsuleId,
          authorId: session.uid,
          authorRole: session.role,
          unlockAt: session.unlockAtIso || new Date(0).toISOString(),
          messageId: itemId,
          message: {
            type: type as FamilyMessageType,
            title,
            content,
            caption,
            storagePaths,
          },
        });
      } else {
        await sealMemory({
          db,
          capsuleId: session.capsuleId,
          authorId: session.uid,
          authorRole: session.role,
          unlockAt: session.unlockAtIso || new Date(0).toISOString(),
          memoryId: itemId,
          memory: {
            type: type as MemoryType,
            title,
            content,
            caption,
            mood,
            tags: tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            vibe: type === "vibe" ? vibe : null,
            storagePaths,
            metadata: { photos: photos.length },
          },
        });
      }

      if (!reduce) {
        const { default: confetti } = await import("canvas-confetti");
        confetti({ particleCount: 90, spread: 70, colors: ["#c4b5fd", "#f9a8d4", "#e9d5ff"] });
      }
      toast("Sealed! Future you is going to cherish this. ✨", "ok");
      router.push("/dashboard");
    } catch (err) {
      setError(toUserMessage(err));
      setSaving(false);
    }
  }

  if (!canUse) {
    return (
      <GlassCard>
        <h1 className="font-serif text-3xl">This door isn’t yours</h1>
        <p className="mt-2 text-muted">Family deposits live in Family Corner. Recipient deposits live here.</p>
      </GlassCard>
    );
  }

  const stepLabels = ["Type", "Details", "Media", "Preview", "Seal"];

  return (
    <div className="space-y-5">
      {/* Progress indicator */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {stepLabels.map((lbl, idx) => {
            const stepNum = idx + 1;
            const isCurrent = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <div key={lbl} className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (stepNum < step) setStep(stepNum);
                  }}
                  disabled={stepNum > step || saving}
                  className={`flex h-7 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition ${
                    isCurrent
                      ? "bg-gradient-to-r from-lilac to-pink text-navy shadow-sm"
                      : isCompleted
                      ? "bg-white/15 text-lavender hover:bg-white/20"
                      : "bg-white/5 text-muted"
                  }`}
                >
                  <span>{stepNum}</span>
                  <span className="hidden sm:inline sm:ml-1.5">{lbl}</span>
                </button>
                {idx < stepLabels.length - 1 && (
                  <span className="text-[10px] text-white/20">›</span>
                )}
              </div>
            );
          })}
        </div>
        <span className="text-xs uppercase tracking-wider text-lilac">
          Step {step} of 5
        </span>
      </div>

      {/* Step 1: Type Selection */}
      {step === 1 && (
        <div className="space-y-3">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-white">Choose memory format</h2>
            <p className="text-sm text-muted">Select how you want to preserve this moment in time.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {picker.map((item) => {
              const selected = type === item.id;
              return (
                <GlassCard
                  key={item.id}
                  onClick={() => {
                    setType(item.id);
                  }}
                  className={`cursor-pointer transition-all duration-200 ${
                    selected
                      ? "border-pink/80 bg-white/15 shadow-[0_0_20px_rgba(249,168,212,0.2)] ring-1 ring-pink"
                      : "hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-2xl text-lavender">{item.label}</h3>
                      <p className="mt-1 text-sm text-muted">{item.blurb}</p>
                    </div>
                    {selected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink text-xs font-bold text-navy">
                        ✓
                      </span>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Content Fields */}
      {step === 2 && (
        <GlassCard className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-white">Fill in the memory</h2>
            <p className="text-sm text-muted">Write from your heart — no one reads this until your 18th.</p>
          </div>
          <Field label="Title" hint="Max 80 characters">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "letter" ? "e.g. To the girl reading this at 18" : "e.g. A night under Manila skies"}
              maxLength={80}
              autoFocus
            />
          </Field>
          {type === "vibe" ? (
            <VibeFields vibe={vibe} setVibe={setVibe} />
          ) : (
            <>
              <Field label={type === "letter" ? "Your Letter / Message" : "Story & Thoughts"}>
                <TextArea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Pour your thoughts freely here..."
                  maxLength={8000}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Mood / Vibe" hint="e.g. nostalgic, excited, peaceful">
                  <TextInput
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="soft"
                  />
                </Field>
                <Field label="Tags" hint="Comma separated (e.g. dreams, highschool, 2026)">
                  <TextInput
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="vibes, memory, 15yo"
                  />
                </Field>
              </div>
            </>
          )}
        </GlassCard>
      )}

      {/* Step 3: Media Upload */}
      {step === 3 && (
        <GlassCard className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-white">Attach voice & photos</h2>
            <p className="text-sm text-muted">Add photos or record a voice note to bring this memory alive.</p>
          </div>
          {type === "voice" || type === "special" ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-pink">Voice Recording</h3>
              <VoiceRecorder onBlob={(blob) => setAudio(blob)} />
            </div>
          ) : null}
          {type === "photo" || type === "special" || type === "letter" || type === "birthday" ? (
            <div className="space-y-4">
              <PhotoUploader photos={photos} setPhotos={setPhotos} />
              <Field label="Album caption (optional)">
                <TextInput
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="A tiny note about these snapshots"
                />
              </Field>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-muted">
              ✨ No extra media required for this type. You’re ready for preview!
            </div>
          )}
        </GlassCard>
      )}

      {/* Step 4: Preview */}
      {step === 4 && (
        <GlassCard className="space-y-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-lilac">{preview.type} Preview</span>
            <h2 className="mt-1 font-serif text-3xl text-white">{preview.title || "Untitled"}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-full bg-white/10 px-3 py-1 text-lavender">Mood: {preview.mood}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-lavender">📷 {preview.photos} photo(s)</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-lavender">
              {preview.hasAudio ? "🎙️ Voice attached" : "🎙️ No voice note"}
            </span>
          </div>
          {preview.content ? (
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-lavender/95">{preview.content}</p>
            </div>
          ) : null}
          {photos.length > 0 ? (
            <div>
              <p className="text-xs text-muted mb-2">Attached photos ({photos.length}):</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={p.preview} alt="" className="h-20 w-full rounded-xl object-cover" />
                ))}
              </div>
            </div>
          ) : null}
        </GlassCard>
      )}

      {/* Step 5: Seal & Confirm */}
      {step === 5 && (
        <GlassCard className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-lilac/40 bg-white/5 text-3xl shadow-[0_0_25px_rgba(216,180,254,0.3)]">
            🔒
          </div>
          <div>
            <h2 className="font-serif text-3xl text-white">Seal this memory?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Once sealed, this content will remain securely locked in the vault until midnight (00:00:00 Asia/Manila) on her 18th birthday.
            </p>
          </div>

          {saving && (
            <div className="space-y-2 rounded-2xl bg-white/5 p-4 text-left">
              <div className="flex justify-between text-xs text-lilac">
                <span>Encrypting & uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-lilac via-pink to-glow transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {error ? (
        <p role="alert" className="rounded-xl bg-rose-500/15 p-3 text-sm text-rose-200 border border-rose-500/30">
          ⚠️ {error}
        </p>
      ) : null}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {step > 1 ? (
          <GhostButton type="button" disabled={saving} onClick={() => setStep((s) => s - 1)}>
            ← Back
          </GhostButton>
        ) : <div />}

        {step < 5 ? (
          <PrimaryButton type="button" onClick={handleNext}>
            Continue →
          </PrimaryButton>
        ) : (
          <PrimaryButton type="button" disabled={saving} onClick={() => void save()}>
            {saving ? `Sealing (${progress}%)…` : "🔒 Seal & Deposit Memory"}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

function VibeFields({ vibe, setVibe }: { vibe: VibeCheck; setVibe: (v: VibeCheck) => void }) {
  const fields: { key: keyof VibeCheck; label: string }[] = [
    { key: "favoriteSpotifySong", label: "Favorite Spotify song" },
    { key: "favoriteKpopArtist", label: "Favorite K-Pop artist" },
    { key: "favoriteAnime", label: "Favorite anime" },
    { key: "favoriteCelebrity", label: "Favorite celebrity" },
    { key: "bestFriends", label: "Best friends" },
    { key: "favoriteFood", label: "Favorite food" },
    { key: "favoriteColor", label: "Favorite color" },
    { key: "currentAesthetic", label: "Current aesthetic" },
    { key: "currentMood", label: "Current mood" },
    { key: "favoriteQuote", label: "Favorite quote" },
    { key: "currentDream", label: "Current dream" },
    { key: "whatILoveRightNow", label: "What I love right now" },
    { key: "whatIWantToChange", label: "What I want to change" },
    { key: "whatIHopeFutureRemembers", label: "What I hope future me remembers" },
  ];
  return (
    <div className="grid gap-4">
      {fields.map((field) => (
        <Field key={field.key} label={field.label}>
          {field.key.startsWith("what") || field.key === "currentDream" || field.key === "favoriteQuote" ? (
            <TextArea
              value={vibe[field.key]}
              onChange={(e) => setVibe({ ...vibe, [field.key]: e.target.value })}
            />
          ) : (
            <TextInput
              value={vibe[field.key]}
              onChange={(e) => setVibe({ ...vibe, [field.key]: e.target.value })}
            />
          )}
        </Field>
      ))}
    </div>
  );
}
