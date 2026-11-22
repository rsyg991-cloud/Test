"use client";

import { useT } from "@/lib/i18n/client";
import type { MockAnswers, MockResult } from "@/lib/mock/grade";
import { multiKey } from "@/lib/mock/grade";
import type { MockQuestion, QuestionGroup } from "@/lib/mock/schema";
import { Icon } from "../icons";

interface Props {
  section: "listening" | "reading";
  group: QuestionGroup;
  answers: MockAnswers;
  onChange: (key: string, value: string) => void;
  flagged?: Set<number>;
  onToggleFlag?: (n: number) => void;
  /** Review mode: results by question number. */
  results?: Map<number, MockResult>;
}

export const questionAnchor = (section: string, n: number) => `q-${section}-${n}`;

export function QuestionGroupView({ section, group, answers, onChange, flagged, onToggleFlag, results }: Props) {
  const review = !!results;
  const first = group.questions[0].n;
  const last = group.questions[group.questions.length - 1].n;
  const showOptionsBox = ["matching", "completion-box"].includes(group.type) && group.options;

  return (
    <section lang="en" dir="ltr" className="rounded-[10px] border p-4 sm:p-5" style={{ borderColor: "var(--line)", background: "var(--surface)" }} aria-label={`Questions ${first}–${last}`}>
      <div className="mb-1 text-sm font-extrabold">Questions {first === last ? first : `${first}–${last}`}</div>
      <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
        {group.instructions.replace(/^Questions? [\d–-]+\.\s*/, "")}
      </p>
      {group.title && <h3 className="mb-3 text-center font-bold">{group.title}</h3>}

      {group.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={group.image.src} alt={group.image.alt} className="mx-auto mb-4 w-full max-w-xl rounded-md border" style={{ borderColor: "var(--line)" }} />
      )}

      {showOptionsBox && (
        <div className="mb-4 rounded-md border p-3 text-sm" style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}>
          {group.type === "completion-box" ? (
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {group.options!.map((o) => (
                <span key={o.key}>
                  <b>{o.key}</b> {o.text}
                </span>
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {group.options!.map((o) => (
                <li key={o.key}>
                  <b className="inline-block min-w-8">{o.key}</b> {o.text}
                </li>
              ))}
            </ul>
          )}
          {group.allowReuse && <p className="mt-2 text-xs font-semibold" style={{ color: "var(--muted)" }}>NB You may use any letter more than once.</p>}
        </div>
      )}

      {group.type === "mcq-multi" ? (
        <MultiChoice group={group} section={section} answers={answers} onChange={onChange} results={results} />
      ) : (
        <ol className="space-y-3">
          {group.questions.map((q) => (
            <QuestionRow key={q.n} section={section} group={group} q={q} value={answers[String(q.n)] ?? ""} onChange={(v) => onChange(String(q.n), v)} flagged={flagged?.has(q.n)} onToggleFlag={onToggleFlag} result={results?.get(q.n)} review={review} />
          ))}
        </ol>
      )}
    </section>
  );
}

function QuestionRow({
  section,
  group,
  q,
  value,
  onChange,
  flagged,
  onToggleFlag,
  result,
  review,
}: {
  section: string;
  group: QuestionGroup;
  q: MockQuestion;
  value: string;
  onChange: (v: string) => void;
  flagged?: boolean;
  onToggleFlag?: (n: number) => void;
  result?: MockResult;
  review: boolean;
}) {
  const options = q.options ?? group.options ?? [];
  const textType = group.type === "completion" || group.type === "short-answer";
  const border = result ? (result.correct ? "var(--success)" : "var(--danger)") : "transparent";

  return (
    <li id={questionAnchor(section, q.n)} className="scroll-mt-28 rounded-md border-2 p-2.5" style={{ borderColor: border }}>
      {q.section && <div className="mb-2 mt-1 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{q.section}</div>}
      <div className="flex items-start gap-3">
        <span className="grid h-7 min-w-7 shrink-0 place-items-center rounded-md px-1 text-sm font-bold" style={{ background: value ? "var(--ink)" : "var(--surface-2)", color: value ? "var(--bg)" : "var(--ink)" }}>
          {q.n}
        </span>
        <div className="min-w-0 flex-1">
          {textType ? (
            <GapText prompt={q.prompt} value={value} onChange={onChange} disabled={review} n={q.n} />
          ) : group.type === "completion-box" ? (
            <GapSelect prompt={q.prompt} value={value} onChange={onChange} disabled={review} n={q.n} keys={options.map((o) => o.key)} />
          ) : (
            <p className="font-medium leading-snug">{q.prompt}</p>
          )}

          {group.type === "mcq" && (
            <div className="mt-2 grid gap-1.5" role="radiogroup" aria-label={`Question ${q.n}`}>
              {options.map((o) => (
                <label key={o.key} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5" style={{ background: value === o.key ? "color-mix(in srgb, var(--brand) 12%, transparent)" : undefined }}>
                  <input type="radio" name={`${section}-${q.n}`} checked={value === o.key} onChange={() => onChange(o.key)} disabled={review} className="mt-1" />
                  <span>
                    <b>{o.key}</b> {o.text}
                  </span>
                </label>
              ))}
            </div>
          )}

          {(group.type === "tfng" || group.type === "ynng") && (
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={`Question ${q.n}`}>
              {(group.type === "tfng" ? ["TRUE", "FALSE", "NOT GIVEN"] : ["YES", "NO", "NOT GIVEN"]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={value === opt}
                  disabled={review}
                  onClick={() => onChange(opt)}
                  className="rounded-full border-2 px-3 py-1 text-xs font-bold"
                  style={{ borderColor: value === opt ? "var(--ink)" : "var(--line)", background: value === opt ? "var(--ink)" : "transparent", color: value === opt ? "var(--bg)" : "var(--ink)" }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {(group.type === "matching" || group.type === "labelling") && (
            <select className="input mt-2 w-auto max-w-full py-1.5" value={value} onChange={(e) => onChange(e.target.value)} disabled={review} aria-label={`Answer for question ${q.n}`}>
              <option value="">Choose…</option>
              {options.map((o) => (
                <option key={o.key} value={o.key}>
                  {group.type === "labelling" ? o.key : `${o.key}${o.text.length < 60 ? ` — ${o.text}` : ""}`}
                </option>
              ))}
            </select>
          )}

          {result && <ReviewNote result={result} />}
        </div>
        {onToggleFlag && !review && (
          <button type="button" onClick={() => onToggleFlag(q.n)} aria-pressed={!!flagged} aria-label={`Flag question ${q.n} for review`} className="shrink-0 rounded-md p-1" style={{ color: flagged ? "var(--writing)" : "var(--line)" }}>
            <Icon name="star" size={18} fill={flagged ? "currentColor" : "none"} />
          </button>
        )}
      </div>
    </li>
  );
}

function GapText({ prompt, value, onChange, disabled, n }: { prompt: string; value: string; onChange: (v: string) => void; disabled: boolean; n: number }) {
  const [before, after] = prompt.includes("___") ? prompt.split("___") : [prompt, ""];
  return (
    <p className="leading-loose">
      {before}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={`Question ${n}`}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className="mx-1 w-40 max-w-full rounded-md border px-2 py-0.5 font-semibold outline-none focus:border-[var(--brand)]"
        style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}
      />
      {after}
    </p>
  );
}

function GapSelect({ prompt, value, onChange, disabled, n, keys }: { prompt: string; value: string; onChange: (v: string) => void; disabled: boolean; n: number; keys: string[] }) {
  const [before, after] = prompt.split("___");
  return (
    <p className="leading-loose">
      {before}
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} aria-label={`Question ${n}`} className="mx-1 rounded-md border px-2 py-0.5 font-semibold" style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}>
        <option value="">—</option>
        {keys.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      {after}
    </p>
  );
}

function MultiChoice({ group, section, answers, onChange, results }: { group: QuestionGroup; section: string; answers: MockAnswers; onChange: (k: string, v: string) => void; results?: Map<number, MockResult> }) {
  const key = multiKey(group.id);
  const picked = (answers[key] ?? "").split(",").filter(Boolean);
  const max = group.questions.length;
  const toggle = (k: string) => {
    const next = picked.includes(k) ? picked.filter((p) => p !== k) : picked.length < max ? [...picked, k] : picked;
    onChange(key, next.sort().join(","));
  };
  return (
    <div id={questionAnchor(section, group.questions[0].n)} className="scroll-mt-28">
      <p className="mb-2 font-medium">{group.prompt}</p>
      <div className="grid gap-1.5">
        {group.options!.map((o) => (
          <label key={o.key} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5" style={{ background: picked.includes(o.key) ? "color-mix(in srgb, var(--brand) 12%, transparent)" : undefined }}>
            <input type="checkbox" checked={picked.includes(o.key)} onChange={() => toggle(o.key)} disabled={!!results || (!picked.includes(o.key) && picked.length >= max)} className="mt-1" />
            <span>
              <b>{o.key}</b> {o.text}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
        {picked.length}/{max} chosen
      </p>
      {results && group.questions.map((q) => results.get(q.n) && <ReviewNote key={q.n} result={results.get(q.n)!} label={`Q${q.n}`} />)}
    </div>
  );
}

function ReviewNote({ result, label }: { result: MockResult; label?: string }) {
  const { t } = useT();
  return (
    <div className="mt-2 rounded-lg p-2.5 text-sm" style={{ background: "var(--surface-2)" }}>
      <div className="flex flex-wrap items-center gap-x-2 font-semibold">
        <Icon name={result.correct ? "check" : "x"} size={15} style={{ color: result.correct ? "var(--success)" : "var(--danger)" }} />
        {label && <span>{label}:</span>}
        {result.correct ? (
          <span>{result.given}</span>
        ) : (
          <>
            <span style={{ color: "var(--success)" }}>{result.expected}</span>
            <span style={{ color: "var(--muted)" }}>· {t("task.yourAnswer", { answer: result.given || t("task.blank") })}</span>
          </>
        )}
      </div>
      {result.explanation && <p className="mt-1" style={{ color: "var(--muted)" }}>{result.explanation}</p>}
    </div>
  );
}
