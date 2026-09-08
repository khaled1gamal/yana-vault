"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, Save, Settings, Shield } from "lucide-react";
import { Field, GhostButton, PrimaryButton, TextArea, TextInput } from "@/components/ui/Primitives";
import { GlassCard } from "@/components/ui/Primitives";
import { toUserMessage } from "@/lib/errors";
import type { CapsuleConfig } from "@/types/models";

export function AdminScreen() {
  const [config, setConfig] = useState<CapsuleConfig | null>(null);
  const [familyText, setFamilyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/config", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    if (json.config) {
      setConfig(json.config);
      setFamilyText((json.config.familyEmails ?? []).join(", "));
    }
  }

  useEffect(() => {
    void load().catch((err) => setError(toUserMessage(err)));
  }, []);

  async function initCapsule() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/config", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessage("Capsule initialized on the server.");
      await load();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!config) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: config.title,
          recipientName: config.recipientName,
          birthDate: config.birthDate,
          timezone: config.timezone || "Asia/Manila",
          welcomeMessage: config.welcomeMessage,
          theme: config.theme || "midnight-lilac",
          status: config.status,
          maxImageBytes: Number(config.maxImageBytes),
          maxAudioBytes: Number(config.maxAudioBytes),
          maxRecordingSeconds: Number(config.maxRecordingSeconds),
          familyEmails: familyText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          confirmUnlockChange: confirmUnlock,
        }),
      });
      const json = await res.json();
      if (res.status === 409) {
        setError(json.error);
        return;
      }
      if (!res.ok) throw new Error(json.error || "Failed to update configuration");
      setMessage(`Configuration saved! Computed unlock: ${json.unlockAtLocalIso || json.unlockAtIso}`);
      await load();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <GlassCard className="border-lilac/30">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-lilac">
          <Shield size={16} className="text-lilac" />
          <span>System Administration</span>
        </div>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl text-white">Capsule Configuration</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Unlock time is computed on the server as 00:00:00 on her 18th birthday in the configured timezone.
          Recipients cannot change it. Every unlock-date edit is audit-logged to the immutable ledger.
        </p>
      </GlassCard>

      {!config ? (
        <GlassCard className="space-y-4 text-center py-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lilac">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-white">No Capsule Initialized</h2>
            <p className="mt-1 text-sm text-muted">Initialize the capsule configuration with seed defaults.</p>
          </div>
          <PrimaryButton type="button" disabled={busy} onClick={() => void initCapsule()} className="mx-auto">
            {busy ? "Initializing..." : "Initialize Capsule from Seed"}
          </PrimaryButton>
        </GlassCard>
      ) : (
        <form onSubmit={(e) => void save(e)} className="glass space-y-5 rounded-[1.8rem] p-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="font-serif text-2xl text-lavender">Basic Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Capsule Title">
                <TextInput value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} required />
              </Field>
              <Field label="Recipient First Name">
                <TextInput
                  value={config.recipientName}
                  onChange={(e) => setConfig({ ...config, recipientName: e.target.value })}
                  required
                />
              </Field>
            </div>
          </div>

          <div className="border-b border-white/10 pb-4">
            <h2 className="font-serif text-2xl text-lavender">Time & Unlock Schedule</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Birth Date" hint="YYYY-MM-DD (Unlock = date + 18 years at 00:00:00)">
                <TextInput
                  type="date"
                  value={config.birthDate}
                  onChange={(e) => setConfig({ ...config, birthDate: e.target.value })}
                  required
                />
              </Field>
              <Field label="IANA Timezone" hint="e.g. Asia/Manila, Asia/Riyadh, UTC">
                <TextInput
                  value={config.timezone || "Asia/Manila"}
                  onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                  required
                />
              </Field>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-xs text-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-300" />
                <div>
                  <p className="font-semibold text-amber-100">Protected Setting Notice</p>
                  <p className="mt-0.5 text-amber-200/90">
                    Modifying birth date or timezone changes the exact moment the vault unlocks. Check the confirmation box below to apply changes.
                  </p>
                  <label className="mt-3 flex items-center gap-2 cursor-pointer text-amber-100 font-medium">
                    <input
                      type="checkbox"
                      checked={confirmUnlock}
                      onChange={(e) => setConfirmUnlock(e.target.checked)}
                      className="rounded border-amber-400/50 bg-black/40 text-pink"
                    />
                    <span>I confirm changing the unlock date schedule</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-white/10 pb-4">
            <h2 className="font-serif text-2xl text-lavender">Capsule Message & Family</h2>
            <div className="mt-4 space-y-4">
              <Field label="Welcome Message (Displayed on Unlocking)">
                <TextArea
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                  maxLength={400}
                />
              </Field>
              <Field label="Family Emails" hint="Comma-separated emails authorized for FAMILY role">
                <TextArea
                  value={familyText}
                  onChange={(e) => setFamilyText(e.target.value)}
                  placeholder="mom@example.com, dad@example.com, tita@example.com"
                />
              </Field>
            </div>
          </div>

          <div className="border-b border-white/10 pb-4">
            <h2 className="font-serif text-2xl text-lavender">Upload Limits & Quotas</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Max Image Size (Bytes)" hint="Default: 8388608 (8MB)">
                <TextInput
                  type="number"
                  value={config.maxImageBytes}
                  onChange={(e) => setConfig({ ...config, maxImageBytes: Number(e.target.value) })}
                />
              </Field>
              <Field label="Max Audio Size (Bytes)" hint="Default: 10485760 (10MB)">
                <TextInput
                  type="number"
                  value={config.maxAudioBytes}
                  onChange={(e) => setConfig({ ...config, maxAudioBytes: Number(e.target.value) })}
                />
              </Field>
              <Field label="Max Recording (Seconds)" hint="Default: 90s (5 - 300s)">
                <TextInput
                  type="number"
                  value={config.maxRecordingSeconds}
                  onChange={(e) => setConfig({ ...config, maxRecordingSeconds: Number(e.target.value) })}
                />
              </Field>
            </div>
          </div>

          <div>
            <Field label="Capsule Status">
              <select
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-navy/80 px-4 text-sm text-white focus:border-lilac/60 focus:outline-none"
                value={config.status}
                onChange={(e) => setConfig({ ...config, status: e.target.value as CapsuleConfig["status"] })}
              >
                <option value="active">Active (Normal operation)</option>
                <option value="paused">Paused (Deposits temporarily paused)</option>
                <option value="archived">Archived (Read-only)</option>
              </select>
            </Field>
          </div>

          {error ? (
            <div role="alert" className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4 text-sm text-rose-200">
              <AlertTriangle size={18} className="shrink-0 text-rose-300" />
              <span>{error}</span>
            </div>
          ) : null}

          {message ? (
            <div role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-sm text-emerald-200">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-300" />
              <span>{message}</span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <PrimaryButton type="submit" disabled={busy} className="inline-flex items-center gap-2">
              <Save size={16} />
              <span>{busy ? "Saving..." : "Save Configuration"}</span>
            </PrimaryButton>
            <GhostButton type="button" disabled={busy} onClick={() => void load()} className="inline-flex items-center gap-2">
              <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
              <span>Reload</span>
            </GhostButton>
          </div>
        </form>
      )}
    </div>
  );
}
