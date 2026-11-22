import { Fragment, type ReactNode } from "react";
import type { Locale } from "./config";
import type { en } from "./messages/en";

/** Plural forms keyed by Intl.PluralRules categories. Arabic uses all six. */
export type Plural = { zero?: string; one: string; two?: string; few?: string; many?: string; other: string };

type Widen<T> = T extends string ? string : T extends Plural ? Plural : { [K in keyof T]: Widen<T[K]> };
/** The shape every language must provide (taken from the English messages). */
export type Messages = Widen<typeof en>;

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
type LeafPaths<T, Leaf> = {
  [K in keyof T & string]: T[K] extends Leaf ? K : T[K] extends Plural ? never : T[K] extends object ? Join<K, LeafPaths<T[K], Leaf>> : never;
}[keyof T & string];
type PluralPaths<T> = {
  [K in keyof T & string]: T[K] extends Plural ? K : T[K] extends string ? never : T[K] extends object ? Join<K, PluralPaths<T[K]>> : never;
}[keyof T & string];

export type MessageKey = LeafPaths<typeof en, string>;
export type PluralKey = PluralPaths<typeof en>;
export type Vars = Record<string, string | number>;

function lookup(messages: Messages, key: string): unknown {
  let cur: unknown = messages;
  for (const part of key.split(".")) {
    if (cur && typeof cur === "object" && part in cur) cur = (cur as Record<string, unknown>)[part];
    else return undefined;
  }
  return cur;
}

export function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Tags inside messages: <b> bold, <hl> the highlighter swipe, <ink> ink-coloured strong, <em> sky accent, <num> mono numbers. */
const TAGS: Record<string, (children: ReactNode, key: number) => ReactNode> = {
  b: (c, k) => <strong key={k}>{c}</strong>,
  ink: (c, k) => (
    <strong key={k} style={{ color: "var(--ink)" }}>
      {c}
    </strong>
  ),
  hl: (c, k) => (
    <span key={k} className="hl">
      {c}
    </span>
  ),
  em: (c, k) => (
    <span key={k} style={{ color: "var(--tile)" }}>
      {c}
    </span>
  ),
  num: (c, k) => (
    <span key={k} className="num">
      {c}
    </span>
  ),
};

/** Render a message that contains simple tags as React nodes. */
export function renderRich(text: string): ReactNode {
  const out: ReactNode[] = [];
  const re = /<(\w+)>(.*?)<\/\1>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const render = TAGS[m[1]];
    out.push(render ? render(m[2], i++) : m[2]);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <Fragment>{out}</Fragment>;
}

const DATE_LOCALE: Record<Locale, string> = {
  en: "en-GB",
  // Gregorian calendar (ar-SA defaults to Hijri) and Latin digits, matching the mono band scores.
  ar: "ar-SA-u-ca-gregory-nu-latn",
};

export function createTranslator(locale: Locale, messages: Messages) {
  const rules = new Intl.PluralRules(locale === "ar" ? "ar" : "en");
  const t = (key: MessageKey, vars?: Vars): string => {
    const v = lookup(messages, key);
    return typeof v === "string" ? interpolate(v, vars) : key;
  };
  const plural = (key: PluralKey, count: number, vars?: Vars): string => {
    const forms = lookup(messages, key) as Plural | undefined;
    if (!forms) return key;
    const cat = rules.select(count) as keyof Plural;
    const text = forms[cat] ?? forms.other;
    return interpolate(text, { count, ...vars });
  };
  const rich = (key: MessageKey, vars?: Vars) => renderRich(t(key, vars));
  const formatDate = (d: Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
    d.toLocaleDateString(DATE_LOCALE[locale], { timeZone: "UTC", ...opts });
  const number = (n: number) => n.toLocaleString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB");
  /** A stage's name, camp, tagline or description. */
  const stage = (id: number, field: "name" | "camp" | "tagline" | "description") => t(`stages.${id}.${field}` as MessageKey);
  /** A study plan's name, expected gain or "best for" line. */
  const planText = (months: number, field: "name" | "gain" | "bestFor") => t(`plans.${months}.${field}` as MessageKey);
  /** "{n} min" or "{n}h" for a daily study time. */
  const duration = (minutes: number) => (minutes >= 60 ? t("common.hoursShort", { n: minutes / 60 }) : t("common.minutesShort", { n: minutes }));
  return { locale, dir: locale === "ar" ? ("rtl" as const) : ("ltr" as const), t, plural, rich, formatDate, number, stage, planText, duration };
}

export type Translator = ReturnType<typeof createTranslator>;
