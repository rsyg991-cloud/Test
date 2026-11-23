"use client";

import { useT } from "@/lib/i18n/client";
import { useEffect, useRef, useState } from "react";
import type { ListeningTask } from "@/content/types";
import { Icon } from "../icons";
import { scriptVoices } from "@/lib/audio/voices";
import { speak, stopSpeech, ttsSupported } from "./speech";

export function ListeningPlayer({ task, revealScript }: { task: ListeningTask; revealScript: boolean }) {
  const { t } = useT();
  const [supported, setSupported] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState(-1);
  const [plays, setPlays] = useState(0);
  const [rate, setRate] = useState(task.rate ?? 1);
  const [examMode, setExamMode] = useState(false);
  const [showText, setShowText] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    setSupported(ttsSupported());
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // The browser's voices (the fallback) load asynchronously in some browsers.
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => {
      cancelled.current = true;
      stopSpeech();
    };
  }, []);

  async function play() {
    if (!ttsSupported()) return;
    stopSpeech();
    const voices = scriptVoices(task.script);
    cancelled.current = false;
    setPlaying(true);
    setPlays((p) => p + 1);
    for (let i = 0; i < task.script.length; i++) {
      if (cancelled.current) break;
      setLine(i);
      await speak(task.script[i].text, { gender: task.script[i].voice, voice: voices[i], rate });
      await new Promise((r) => setTimeout(r, 350));
    }
    setPlaying(false);
    setLine(-1);
  }

  function stop() {
    cancelled.current = true;
    stopSpeech();
    setPlaying(false);
    setLine(-1);
  }

  const blocked = examMode && plays >= 1 && !playing;
  const progress = line < 0 ? (plays > 0 && !playing ? 1 : 0) : (line + 1) / task.script.length;

  return (
    <div className="rounded-[10px] p-5" style={{ background: "color-mix(in srgb, var(--listening) 10%, var(--surface))", border: "1px solid var(--line)" }}>
      <div className="eyebrow mb-1" style={{ color: "var(--listening)" }}>
        {t("listening.audio")}
      </div>
      <p className="mb-4 font-semibold" lang="en" dir="ltr">
        {task.context}
      </p>

      {!supported ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t("listening.noAudio")}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {playing ? (
              <button type="button" onClick={stop} className="btn btn-dark" aria-label={t("listening.stopAria")}>
                <Icon name="stop" size={18} /> {t("listening.stop")}
              </button>
            ) : (
              <button type="button" onClick={play} disabled={blocked} className="btn btn-primary">
                <Icon name="play" size={18} /> {plays === 0 ? t("listening.play") : blocked ? t("listening.playedOnce") : t("listening.playAgain")}
              </button>
            )}
            <label className="flex items-center gap-2 text-sm font-semibold">
              {t("listening.speed")}
              <select className="input w-auto py-1.5" value={rate} onChange={(e) => setRate(Number(e.target.value))} disabled={playing}>
                <option value={0.8}>{t("listening.slow")}</option>
                <option value={0.9}>{t("listening.slower")}</option>
                <option value={1}>{t("listening.normal")}</option>
                <option value={1.15}>{t("listening.examPlus")}</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={examMode} onChange={(e) => setExamMode(e.target.checked)} disabled={plays > 0} />
              {t("listening.examMode")}
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-8 flex-1 items-end gap-[3px]" aria-hidden="true">
              {Array.from({ length: 48 }).map((_, i) => {
                const active = i / 48 < progress;
                const h = 25 + Math.abs(Math.sin(i * 1.7)) * 75;
                return (
                  <span
                    key={i}
                    className="flex-1 rounded-full transition-colors"
                    style={{ height: `${playing && Math.abs(i / 48 - progress) < 0.03 ? 100 : h}%`, background: active ? "var(--listening)" : "var(--line)" }}
                  />
                );
              })}
            </div>
            <span className="text-xs font-bold" style={{ color: "var(--muted)" }}>
              {playing ? `${line + 1}/${task.script.length}` : plays > 0 ? t("listening.played", { n: plays }) : ""}
            </span>
          </div>
        </>
      )}

      {(revealScript || !supported) && (
        <div className="mt-4">
          <button type="button" className="text-sm font-bold underline" onClick={() => setShowText((s) => !s)}>
            {showText ? t("listening.hideTranscript") : t("listening.showTranscript")}
          </button>
          {showText && (
            <div className="mt-3 space-y-2 rounded-md p-4 text-[15px] leading-relaxed" style={{ background: "var(--surface)" }} lang="en" dir="ltr">
              {task.script.map((l, i) => (
                <p key={i}>
                  <span className="font-bold" style={{ color: l.voice === "female" ? "var(--listening)" : "var(--reading)" }}>
                    {l.speaker}:
                  </span>{" "}
                  {l.text}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
