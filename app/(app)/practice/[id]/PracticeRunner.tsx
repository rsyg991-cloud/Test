"use client";

import { useT } from "@/lib/i18n/client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { completePractice, type CompletionResult } from "@/app/actions/learn";
import type { PracticePrompt } from "@/content/types";
import { Celebration } from "@/components/Celebration";
import { Icon } from "@/components/icons";
import { SpeakingTaskView } from "@/components/task/SpeakingTaskView";
import { WritingTaskView } from "@/components/task/WritingTaskView";
import { SkillBadge } from "@/components/ui";

export function PracticeRunner({ prompt }: { prompt: PracticePrompt }) {
  const { t } = useT();
  const [result, setResult] = useState<CompletionResult | null>(null);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  function onEvaluated(attemptId: string) {
    start(async () => {
      const r = await completePractice(prompt.id, attemptId);
      if (!r.ok) return setError(r.error);
      setResult(r);
      setShow(true);
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/practice" className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "var(--surface-2)" }} aria-label={t("drill.back")}>
          <Icon name="back" size={18} />
        </Link>
        <div>
          <SkillBadge skill={prompt.skill} />
          <h1 className="mt-1 font-display text-2xl" lang="en" dir="auto">
            {prompt.title}
          </h1>
        </div>
      </div>
      {prompt.writing && <WritingTaskView task={prompt.writing} source="practice" refId={prompt.id} onEvaluated={onEvaluated} />}
      {prompt.speaking && <SpeakingTaskView task={prompt.speaking} source="practice" refId={prompt.id} onEvaluated={onEvaluated} />}
      {error && (
        <p role="alert" className="mt-4 font-semibold" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      {result && (
        <div className="mt-6 flex justify-end">
          <Link href="/practice" className="btn btn-primary">
            {t("drill.more")} <Icon name="arrow" size={18} />
          </Link>
        </div>
      )}
      {show && result && (
        <Celebration
          title={t("drill.done")}
          subtitle={t("drill.doneBody")}
          band={result.band}
          xp={result.activity.xpGained}
          streak={result.activity.streak}
          streakExtended={result.activity.streakExtended}
          freezeEarned={result.activity.freezeEarned}
          nextHref="/dashboard"
          nextTitle={t("drill.backToday")}
          onClose={() => setShow(false)}
        />
      )}
    </div>
  );
}
