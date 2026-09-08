"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import { validateRecordingDuration } from "@/lib/validation/schemas";
import { DEFAULT_MAX_RECORDING_SECONDS } from "@/constants/capsule";

export function VoiceRecorder({
  onBlob,
  maxSeconds = DEFAULT_MAX_RECORDING_SECONDS,
}: {
  onBlob: (blob: Blob | null, duration: number) => void;
  maxSeconds?: number;
}) {
  const [supported, setSupported] = useState(true);
  const [state, setState] = useState<"idle" | "recording" | "paused" | "ready">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(Array.from({ length: 24 }, () => 4));
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const timer = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const secondsRef = useRef(0);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "MediaRecorder" in window);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunks.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" });
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = URL.createObjectURL(blob);
        if (audioRef.current) audioRef.current.src = urlRef.current;
        const invalid = validateRecordingDuration(secondsRef.current, maxSeconds);
        if (invalid) {
          setError(invalid);
          onBlob(null, 0);
          return;
        }
        onBlob(blob, secondsRef.current);
        setState("ready");
      };
      mediaRef.current = recorder;
      recorder.start(100);
      setState("recording");
      secondsRef.current = 0;
      setSeconds(0);
      timer.current = window.setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        setLevels(Array.from({ length: 24 }, () => 6 + Math.random() * 24));
        if (secondsRef.current >= maxSeconds) stop();
      }, 1000);
    } catch {
      setError("Microphone permission is needed to record voice memories.");
    }
  }

  function pause() {
    mediaRef.current?.pause();
    setState("paused");
    if (timer.current) window.clearInterval(timer.current);
  }

  function resume() {
    mediaRef.current?.resume();
    setState("recording");
    timer.current = window.setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
      setLevels(Array.from({ length: 24 }, () => 6 + Math.random() * 24));
      if (secondsRef.current >= maxSeconds) stop();
    }, 1000);
  }

  function stop() {
    if (timer.current) window.clearInterval(timer.current);
    if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop();
  }

  function clear() {
    onBlob(null, 0);
    setState("idle");
    setSeconds(0);
    secondsRef.current = 0;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }

  if (!supported) {
    return (
      <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
        This browser doesn’t support voice recording. Try Chrome, Edge, or Safari.
      </p>
    );
  }

  const percent = Math.min(100, Math.round((seconds / maxSeconds) * 100));

  return (
    <div className="space-y-4">
      {/* Waveform / Visualizer */}
      <div className="flex h-16 items-end justify-center gap-1.5 rounded-2xl bg-black/20 px-4 py-2" aria-hidden>
        {levels.map((level, i) => (
          <span
            key={i}
            className={`w-1 rounded-full transition-all duration-150 ${
              state === "recording"
                ? "bg-gradient-to-t from-lilac to-pink shadow-[0_0_8px_rgba(249,168,212,0.6)]"
                : state === "paused"
                ? "bg-amber-300/60"
                : state === "ready"
                ? "bg-emerald-300/60"
                : "bg-white/10"
            }`}
            style={{ height: state === "recording" ? `${Math.max(8, level)}px` : "6px" }}
          />
        ))}
      </div>

      {/* Timer & Duration */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">
          {state === "recording" ? "🔴 Recording..." : state === "paused" ? "⏸️ Paused" : state === "ready" ? "✅ Recorded" : "🎙️ Ready to record"}
        </span>
        <span className="font-mono text-lavender">
          {seconds}s / {maxSeconds}s ({percent}%)
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {state === "idle" ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-lilac to-pink px-6 text-sm font-semibold text-navy shadow-[0_0_20px_rgba(249,168,212,0.4)] transition hover:opacity-95 active:scale-95"
            onClick={() => void start()}
          >
            <Mic size={16} />
            <span>Start recording</span>
          </button>
        ) : null}

        {state === "recording" ? (
          <>
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 text-xs font-medium text-white transition hover:bg-white/20 active:scale-95"
              onClick={pause}
            >
              <Pause size={14} />
              <span>Pause</span>
            </button>
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-pink px-5 text-xs font-semibold text-navy shadow-sm transition hover:opacity-90 active:scale-95"
              onClick={stop}
            >
              <Square size={14} />
              <span>Stop & save note</span>
            </button>
          </>
        ) : null}

        {state === "paused" ? (
          <>
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-lilac to-pink px-4 text-xs font-semibold text-navy transition hover:opacity-95 active:scale-95"
              onClick={resume}
            >
              <Play size={14} />
              <span>Resume</span>
            </button>
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white/10 px-4 text-xs font-medium text-white transition hover:bg-white/20 active:scale-95"
              onClick={stop}
            >
              <Square size={14} />
              <span>Finish</span>
            </button>
          </>
        ) : null}

        {state === "ready" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/10 px-4 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 active:scale-95"
              onClick={clear}
            >
              <Trash2 size={14} />
              <span>Record again</span>
            </button>
          </div>
        ) : null}
      </div>

      {state === "ready" && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
          <audio ref={audioRef} controls className="w-full" />
        </div>
      )}

      {error ? (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
