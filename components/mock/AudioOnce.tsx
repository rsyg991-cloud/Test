"use client";

import { useEffect, useRef, useState } from "react";
import type { ListeningPart } from "@/lib/mock/schema";
import { Icon } from "../icons";
import { speak, ttsSupported } from "../task/speech";

/**
 * Plays a listening part exactly once, like the real test: a real recording (licensed tests)
 * or the script read aloud by the browser. A watchdog ends playback if the browser never
 * reports the end of speech.
 */
export function AudioOnce({ part, autoStart, onEnded, timeScale = 1 }: { part: ListeningPart; autoStart: boolean; onEnded: () => void; timeScale?: number }) {
  const [state, setState] = useState<"ready" | "playing" | "ended">("ready");
  const [line, setLine] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const done = useRef(false);
  const total = part.script?.length ?? 0;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    if (ttsSupported()) window.speechSynthesis.cancel();
    setState("ended");
    onEnded();
  };

  async function play() {
    if (state !== "ready") return;
    setState("playing");
    if (part.audioUrl) {
      audioRef.current?.play().catch(() => finish());
      return;
    }
    const words = (part.script ?? []).reduce((a, l) => a + l.text.split(/\s+/).length, 0);
    const watchdog = setTimeout(finish, Math.max(3000, (words / 2.4) * 1000 * 1.3 * timeScale));
    if (!ttsSupported() || timeScale < 1) {
      // No speech engine (or a sped-up test run): wait for the estimated duration.
      return;
    }
    for (let i = 0; i < total && !done.current; i++) {
      setLine(i + 1);
      await speak(part.script![i].text, { gender: part.script![i].voice });
    }
    clearTimeout(watchdog);
    finish();
  }

  useEffect(() => {
    if (autoStart) void play();
    return () => {
      if (ttsSupported()) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl p-4" style={{ background: "color-mix(in srgb, var(--listening) 10%, var(--surface))" }}>
      {part.audioUrl && <audio ref={audioRef} src={part.audioUrl} preload="auto" onEnded={finish} onError={finish} />}
      <span className="grid h-11 w-11 place-items-center rounded-full text-white" style={{ background: "var(--listening)" }}>
        <Icon name={state === "playing" ? "volume" : state === "ended" ? "check" : "headphones"} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-bold">Part {part.part}</div>
        <div className="text-sm" style={{ color: "var(--muted)" }}>
          {state === "ready" && "The recording will play once only."}
          {state === "playing" && (part.audioUrl ? "Playing…" : `Playing… ${line}/${total}`)}
          {state === "ended" && "Recording finished."}
        </div>
      </div>
      {state === "ready" && !autoStart && (
        <button type="button" className="btn btn-primary" style={{ background: "var(--listening)" }} onClick={play}>
          <Icon name="play" size={16} /> Play
        </button>
      )}
    </div>
  );
}
