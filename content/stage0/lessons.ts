/**
 * Stage 0, Unit 0 (welcome) and Unit 1 (letters and sounds, l1–l8) + the Unit 1 check.
 * Lessons are generated from a short spec per lesson so every exercise follows the same rules;
 * tests/stage0-content.test.ts then checks every step against what has been taught before it.
 */
import { GRAPHEMES, graphemeById, type GraphemeId, type Item, type ItemId } from "../items";
import { CHUNKS, CODAS, ONSETS, PATTERNS, PSEUDO_WORDS, SIGHT_WORDS, WORDS } from "./items";
import type { Stage0Lesson, Step } from "./types";

export const stage0Items: Item[] = [...GRAPHEMES, ...WORDS, ...PSEUDO_WORDS, ...SIGHT_WORDS, ...CHUNKS, ...PATTERNS];
export const stage0ItemById = new Map<string, Item>(stage0Items.map((x) => [x.id, x]));

const item = (id: string) => {
  const x = stage0ItemById.get(id);
  if (!x) throw new Error(`Unknown Stage 0 item ${id}`);
  return x;
};
const textOf = (id: string) => {
  const x = item(id);
  return "text" in x ? x.text : "spelling" in x ? x.spelling : x.label;
};
const arOf = (id: string) => {
  const x = item(id);
  return "ar" in x ? x.ar : "";
};
const imageOf = (id: string) => (item(id) as { image?: string }).image;
const gpcOf = (id: string) => (item(id) as { gpc?: GraphemeId[] }).gpc ?? [];

export const LETTER_NAMES: Record<string, { ipa: string; ar: string }> = Object.fromEntries(
  (
    [
      ["a", "eɪ", "إيه"], ["b", "biː", "بي"], ["c", "siː", "سي"], ["d", "diː", "دي"], ["e", "iː", "إي"],
      ["f", "ɛf", "إف"], ["g", "dʒiː", "جي"], ["h", "eɪtʃ", "إيتش"], ["i", "aɪ", "آي"], ["j", "dʒeɪ", "جيه"],
      ["k", "keɪ", "كيه"], ["l", "ɛl", "إل"], ["m", "ɛm", "إم"], ["n", "ɛn", "إن"], ["o", "oʊ", "أو"],
      ["p", "piː", "بي (بنفَس)"], ["q", "kjuː", "كيو"], ["r", "ɑɹ", "آر"], ["s", "ɛs", "إس"], ["t", "tiː", "تي"],
      ["u", "juː", "يو"], ["v", "viː", "في"], ["w", "ˈdʌbəljuː", "دبليو"], ["x", "ɛks", "إكس"], ["y", "waɪ", "واي"],
      ["z", "ziː", "زي"],
    ] as const
  ).map(([l, ipa, ar]) => [l, { ipa, ar }]),
);

// ---------- step builders (Arabic templates) ----------

let counter = 0;
const sid = (lesson: string) => `${lesson}-s${++counter}`;

/** Rotate through a pool deterministically, skipping excluded ids. */
function pick<T extends string>(pool: readonly T[], exclude: readonly string[], n: number, seed: number): T[] {
  const rest = pool.filter((x) => !exclude.includes(x));
  const out: T[] = [];
  for (let i = 0; i < rest.length && out.length < n; i++) out.push(rest[(seed + i) % rest.length]);
  return out;
}

/** The n spelled items closest to the target: same length, most graphemes in the same place. */
function neighbours(target: string, pool: readonly string[], n = 2): string[] {
  const t = gpcOf(target);
  return pool
    .filter((id) => id !== target && gpcOf(id).length === t.length && textOf(id) !== textOf(target))
    .map((id) => ({ id, same: gpcOf(id).filter((g, i) => g === t[i]).length }))
    .sort((a, b) => b.same - a.same || textOf(a.id).localeCompare(textOf(b.id)))
    .slice(0, n)
    .map((x) => x.id);
}

const segments = (id: string) => gpcOf(id).map((g) => graphemeById.get(g)!.spelling.replace("_e", "…e")).join(" - ");

function teach(L: string, teaches: ItemId[], explainAr: string, keyword?: ItemId): Step {
  return { id: sid(L), type: "teach", ar: "تعلّم الجديد: اسمع وشوف.", teaches, explainAr, ...(keyword ? { keyword } : {}) };
}

function soundPick(L: string, target: GraphemeId, taught: GraphemeId[], seed: number): Step {
  const g = graphemeById.get(target)!;
  const others = pick(taught, [target, ...taught.filter((x) => graphemeById.get(x)!.ipa === g.ipa)], 2, seed);
  return {
    id: sid(L),
    type: "soundPick",
    dimension: "WF",
    ar: "اسمع الصوت واختر الحرف.",
    target,
    options: [target, ...others],
    wrongAr: `الحرف «${g.spelling}» صوته /${g.ipa}/: ${g.ar}.`,
  };
}

function decodePick(L: string, target: string, pool: string[]): Step {
  const pseudo = target.startsWith("pw:");
  return {
    id: sid(L),
    type: "decodePick",
    dimension: "DC",
    ar: pseudo
      ? "هذي كلمة مو حقيقية. اقرأها بنفسك صوت صوت، ثم اختر الصوت اللي يطابقها."
      : "اقرأ الكلمة بنفسك صوت صوت، ثم اختر الصوت اللي يطابقها.",
    target: target as ItemId,
    options: [target, ...neighbours(target, pool)] as ItemId[],
    wrongAr: `اقرأها صوت صوت: ${segments(target)} ← «${textOf(target)}»${pseudo ? " (مو كلمة حقيقية)" : ""}.`,
  };
}

function readPick(L: string, target: string, pictured: string[], seed: number): Step {
  return {
    id: sid(L),
    type: "readPick",
    dimension: "WF",
    ar: "اقرأ الكلمة بدون صوت، واختر الصورة.",
    target: target as ItemId,
    options: [target, ...pick(pictured, [target], 2, seed)] as ItemId[],
    wrongAr: `«${textOf(target)}» معناها ${arOf(target)}. اقرأها صوت صوت: ${segments(target)}.`,
  };
}

function spell(L: string, target: string): Step {
  return {
    id: sid(L),
    type: "spell",
    dimension: "SP",
    ar: "اسمع الكلمة واكتبها.",
    target: target as ItemId,
    input: "keyboard",
    wrongAr: `تنكتب «${textOf(target)}»: ${segments(target)}.`,
  };
}

function contrast(L: string, a: string, b: string): Step[] {
  const one = (target: string, other: string): Step => ({
    id: sid(L),
    type: "contrast",
    dimension: "AR",
    listeningOnly: true,
    ar: "استماع فقط: اسمع واختر الصورة أو المعنى.",
    target: target as ItemId,
    options: [target, other] as ItemId[],
    wrongAr: `الفرق صوت واحد بس: «${arOf(a)}» و«${arOf(b)}». اسمعهم مرة ثانية وركّز على الصوت المختلف.`,
  });
  return [one(a, b), one(b, a)];
}

function listenPick(L: string, target: string, pool: string[], seed: number): Step {
  return {
    id: sid(L),
    type: "listenPick",
    dimension: "AR",
    ar: "اسمع واختر المعنى.",
    target: target as ItemId,
    options: [target, ...pick(pool, [target], 2, seed)] as ItemId[],
    wrongAr: `«${textOf(target)}» معناها ${arOf(target)}.`,
  };
}

function show(L: string, tokens: ItemId[], ar = "اسمع وتابع معنا."): Step {
  return { id: sid(L), type: "show", ar, tokens };
}

function say(L: string, tokens: ItemId[]): Step {
  return {
    id: sid(L),
    type: "say",
    dimension: "OR",
    optional: true,
    ar: "قلها بصوتك (اختياري). نسمع محاولتك، لكن ما نصحح نطقك آلياً: قارن صوتك بالنموذج.",
    target: tokens,
    model: tokens,
  };
}

const PUNCT = new Set(["p:full-stop", "p:exclamation", "p:question-mark"]);
function sentence(tokens: string[]): string {
  let s = "";
  tokens.forEach((t, i) => {
    const txt = textOf(t);
    const shown = i === 0 ? txt[0].toUpperCase() + txt.slice(1) : txt;
    s += PUNCT.has(t) ? shown : (s ? " " : "") + shown;
  });
  return s;
}

function build(L: string, tokens: ItemId[]): Step {
  return {
    id: sid(L),
    type: "build",
    dimension: "PU",
    ar: "رتّب الكلمات وكوّن الجملة.",
    tokens,
    wrongAr: `الترتيب الصحيح: ${sentence(tokens)}`,
  };
}

// ---------- lesson specs ----------

interface Spec {
  id: string;
  index: number;
  title: string;
  titleAr: string;
  objectivesAr: string[];
  minutes: number;
  /** Graphemes in teaching order, each with its keyword and Arabic explanation. */
  graphemes: [GraphemeId, ItemId | undefined, string][];
  /** Other things taught in this lesson (patterns, sight words), with their explanation. */
  extra?: [ItemId[], string][];
  readable: string[];
  pseudo: string[];
  contrasts: [string, string][];
  spell: string[];
  oral: { chunks: ItemId[] };
  builds: ItemId[][];
  /** Extra steps placed after the standard ones. */
  more?: (L: string) => Step[];
}

const g = (s: string) => `g:${s}` as GraphemeId;
const W = (s: string) => `w:${s}` as ItemId;

const SPECS: Spec[] = [
  {
    id: "z0-u1-l1",
    index: 1,
    title: "s a t p i n",
    titleAr: "أول ستة حروف",
    objectivesAr: [
      "أعرف أصوات s a t p i n وأشكالها الكبيرة والصغيرة",
      "أقرأ كلمات من ثلاث حروف مثل sit و pin",
      "أقرأ الكلمة I وأكتب أول جملة: I sit.",
    ],
    minutes: 30,
    graphemes: [
      [g("s"), W("sun"), "الحرف s (والكبير S) صوته «سْ» مثل السين. الإنجليزي فيه حرف كبير وصغير لنفس الصوت."],
      [g("a"), W("ant"), "الحرف a (والكبير A) صوته /æ/: فتحة ممدودة قليلاً، مثل أول ant."],
      [g("t"), W("tap"), "الحرف t (والكبير T) صوته «تْ»."],
      [g("p"), W("pan"), "الحرف p (والكبير P) صوته مثل «ب» لكن بدون صوت من الحنجرة ومع نفَس. حط يدك قدام فمك: لازم تحس بالهواء."],
      [g("i"), W("insect"), "الحرف i (والكبير I) صوته /ɪ/: كسرة قصيرة، مثل أول insect."],
      [g("n"), W("net"), "الحرف n (والكبير N) صوته «نْ»."],
    ],
    extra: [
      [["sw:I"], "الكلمة I معناها «أنا». نطقها «آي» مثل اسم الحرف، مو مثل صوته، وتنكتب دايم بحرف كبير."],
      [["p:full-stop", "p:exclamation", "p:apostrophe"], "«.» نهاية الجملة · «!» حماس أو تحية · «'» تختصر حرف: I'm = I am."],
    ],
    readable: ["at", "it", "in", "sat", "sit", "tap", "pan", "pin", "tin", "nap", "pat", "tip", "pit", "tan"],
    pseudo: ["tas", "nin", "nis", "ip", "ap"],
    contrasts: [["pin", "bin"]],
    spell: ["sat", "pin", "tap", "nap"],
    oral: { chunks: ["ch:hello", "ch:im", "ch:whats-your-name"] },
    builds: [["sw:I", W("sit"), "p:full-stop"]],
    more: (L) => [
      teach(L, [], "اختر اسم شخصيتك: Nat أو Pat. اسمك أنت تقدر تقوله بصوتك، بدون تصحيح."),
      show(L, ["ch:hello", "p:exclamation", "ch:im", "w:name-nat", "p:full-stop"]),
      say(L, ["ch:hello", "ch:im", "w:name-nat"]),
      {
        id: sid(L),
        type: "readText",
        dimension: "WF",
        ar: "اقرأ النص واضغط على الاسم Nat. (اضغط على Hello أو I'm لو تبغى تسمعهم)",
        tokens: ["ch:hello", "p:exclamation", "ch:im", "w:name-nat", "p:full-stop", "sw:I", W("sit"), "p:full-stop"],
        target: "w:name-nat",
        options: ["w:name-nat", "sw:I", W("sit")],
        wrongAr: "Nat تبدأ بالحرف الكبير N، صوته «نْ»: N - a - t.",
      },
      build(L, ["ch:hello", "p:exclamation", "ch:im", "w:name-nat", "p:full-stop"]),
    ],
  },
  {
    id: "z0-u1-l2",
    index: 2,
    title: "m d g o c k",
    titleAr: "ستة حروف جديدة",
    objectivesAr: ["أعرف أصوات m d g o c k", "أعرف أن c و k لهم نفس الصوت", "أقرأ كلمات مثل map و cat و top"],
    minutes: 25,
    graphemes: [
      [g("m"), "w:moon", "الحرف m (والكبير M) صوته «مْ»."],
      [g("d"), "w:duck", "الحرف d (والكبير D) صوته «دْ»."],
      [g("g"), "w:goat", "الحرف g (والكبير G) صوته مثل الجيم المصرية، مثل أول goat."],
      [g("o"), "w:octopus", "الحرف o (والكبير O) صوته /ɑ/: «آ» مفتوحة من آخر الفم، مثل أول octopus."],
      [g("c"), "w:cat", "الحرف c (والكبير C) صوته «كْ»."],
      [g("k"), "w:kite", "الحرف k (والكبير K) صوته «كْ» بعد. c و k نفس الصوت، والفرق في الكتابة بس."],
    ],
    readable: ["map", "man", "mat", "dad", "dig", "got", "top", "pot", "mop", "cat", "can", "cap", "cot", "kid", "kit", "dim", "mad"],
    pseudo: ["dop", "pid", "kam", "nim"],
    contrasts: [["cat", "cot"]],
    spell: ["map", "dig", "top", "cat", "kid"],
    oral: { chunks: ["ch:bye", "ch:thank-you"] },
    builds: [["sw:I", W("dig"), "p:full-stop"], ["sw:I", W("can"), W("sit"), "p:full-stop"]],
  },
  {
    id: "z0-u1-l3",
    index: 3,
    title: "e u r h b f",
    titleAr: "ستة حروف وأصوات متقاربة",
    objectivesAr: ["أعرف أصوات e u r h b f", "أفرّق بالسمع بين p و b، و e و i، و a و u", "أقرأ كلمات مثل pen و sun و bus"],
    minutes: 30,
    graphemes: [
      [g("e"), "w:egg", "الحرف e (والكبير E) صوته /ɛ/: مثل «إيه» قصيرة، مثل أول egg."],
      [g("u"), "w:umbrella", "الحرف u (والكبير U) صوته /ʌ/: «أَ» قصيرة من وسط الفم، مثل أول umbrella."],
      [g("r"), "w:rabbit", "الحرف r (والكبير R) صوته راء بدون ترديد: اللسان ما يلمس سقف الفم."],
      [g("h"), "w:hat", "الحرف h (والكبير H) صوته «هـ»."],
      [g("b"), "w:ball", "الحرف b (والكبير B) صوته «بْ» مع صوت من الحنجرة. قارنه بـ p اللي فيه نفَس بدون صوت."],
      [g("f"), "w:fox", "الحرف f (والكبير F) صوته «فْ»."],
    ],
    readable: ["pen", "ten", "bed", "red", "hen", "sun", "net", "bus", "cup", "mug", "run", "hat", "hot", "hut", "bat", "bin", "big", "fan", "fun", "fig", "rug", "hop"],
    pseudo: ["rup", "bem", "hib", "dut", "fep"],
    contrasts: [["pin", "bin"], ["pat", "bat"], ["pen", "pin"], ["ten", "tin"], ["hat", "hut"], ["cap", "cup"]],
    spell: ["pen", "bed", "sun", "cup", "hat", "fan"],
    oral: { chunks: ["ch:how-are-you", "ch:im-fine"] },
    builds: [["sw:I", W("run"), "p:full-stop"], ["sw:I", W("can"), W("hop"), "p:full-stop"]],
  },
  {
    id: "z0-u1-l4",
    index: 4,
    title: "l j v w y z x qu",
    titleAr: "باقي الحروف",
    objectivesAr: ["أعرف أصوات l j v w y z x qu", "أفرّق بالسمع بين v و f، و v و w", "أفهم الأرقام من 1 إلى 10 بالسمع"],
    minutes: 30,
    graphemes: [
      [g("l"), "w:lion", "الحرف l (والكبير L) صوته «لْ»."],
      [g("j"), "w:jet", "الحرف j (والكبير J) صوته «جْ»."],
      [g("v"), "w:van", "الحرف v (والكبير V) صوته مثل «ف» لكن مع صوت من الحنجرة: الأسنان العليا على الشفة السفلى."],
      [g("w"), "w:web", "الحرف w (والكبير W) صوته «و» بشفايف مدوّرة."],
      [g("y"), "w:yoyo", "الحرف y (والكبير Y) في أول الكلمة صوته «ي»."],
      [g("z"), "w:zebra", "الحرف z (والكبير Z) صوته «زْ»."],
      [g("x"), "w:box", "الحرف x (والكبير X) في آخر الكلمة صوته «كس»."],
      [g("qu"), undefined, "q تجي دايم مع u: qu صوتهم «كو»، مثل quiz."],
    ],
    readable: ["leg", "lip", "jam", "jet", "jug", "van", "vet", "web", "wet", "win", "yes", "yum", "zip", "box", "six", "fox", "quiz"],
    pseudo: ["vop", "jit", "wem", "zun", "lub", "quep"],
    contrasts: [["van", "fan"], ["vet", "wet"]],
    spell: ["leg", "van", "web", "box", "six"],
    oral: {
      chunks: ["ch:num-1", "ch:num-2", "ch:num-3", "ch:num-4", "ch:num-5", "ch:num-6", "ch:num-7", "ch:num-8", "ch:num-9", "ch:num-10"],
    },
    builds: [["sw:I", W("win"), "p:full-stop"]],
  },
  {
    id: "z0-u1-l5",
    index: 5,
    title: "A to Z",
    titleAr: "أسماء الحروف والتهجئة",
    objectivesAr: ["أعرف اسم كل حرف من A إلى Z", "أعرف أن اسم الحرف غير صوته", "أفهم كلمة مهجّأة بأسماء الحروف (B-U-S)"],
    minutes: 25,
    graphemes: [],
    extra: [
      [["p:letter-names"], "كل حرف له اسم وصوت. اسم b «بي» وصوته «بْ». نستخدم الأسماء لما نتهجّى: B-U-S = bus. أسماء الحروف المتحركة: A «إيه» · E «إي» · I «آي» · O «أو» · U «يو»."],
    ],
    readable: [],
    pseudo: [],
    contrasts: [],
    spell: [],
    oral: { chunks: ["ch:can-you-spell-it"] },
    builds: [],
    more: (L) => {
      const letters = Object.keys(LETTER_NAMES);
      const steps: Step[] = letters.map((letter, i) => ({
        id: sid(L),
        type: "namePick",
        dimension: "WF",
        ar: "اسمع اسم الحرف واختر الحرف.",
        letter,
        options: [letter, letters[(i + 7) % 26], letters[(i + 13) % 26]],
        wrongAr: `اسم الحرف ${letter.toUpperCase()} هو «${LETTER_NAMES[letter].ar}»${graphemeById.has(g(letter)) ? `، وصوته /${graphemeById.get(g(letter))!.ipa}/` : ""}.`,
      }));
      const spelled: ItemId[] = ["w:bus", "w:map", "w:sun", "w:cup", "w:pen", "w:fox"];
      for (const [i, target] of spelled.entries()) {
        steps.push({
          id: sid(L),
          type: "nameSpellPick",
          dimension: "WF",
          ar: "اسمع الكلمة مهجّأة بأسماء الحروف، واختر الكلمة.",
          target,
          options: [target, ...pick(spelled, [target], 2, i)],
          wrongAr: `سمعت أسماء الحروف ${textOf(target).toUpperCase().split("").join("-")}، وهذي تكوّن الكلمة «${textOf(target)}» (${arOf(target)}).`,
        });
      }
      steps.push(say(L, ["w:name-nat"]));
      return steps;
    },
  },
  {
    id: "z0-u1-l6",
    index: 6,
    title: "sh ch th ck ng nk",
    titleAr: "حرفين بصوت واحد",
    objectivesAr: ["أعرف أن sh ch th ck ng nk كل وحدة صوت واحد", "أفرّق بين صوتين لـ th (thin و this)", "أقرأ كلمات مثل ship و fish و think"],
    minutes: 30,
    graphemes: [
      [g("sh"), "w:ship", "sh حرفين بصوت واحد: «ش»."],
      [g("ch"), "w:chat", "ch صوتها «تش»."],
      [g("th"), "w:think", "th لها صوتين. الأول «ث» مثل think و thin: طرف اللسان بين الأسنان، بدون صوت من الحنجرة."],
      [g("th/ð"), undefined, "الصوت الثاني لـ th هو «ذ» مثل this و that و then، مع صوت من الحنجرة."],
      [g("ck"), "w:duck", "ck في آخر الكلمة صوتها «كْ» واحدة، بعد حرف متحرك قصير: duck, back."],
      [g("ng"), "w:ring", "ng صوتها من الأنف «نغ» بدون غين واضحة في الآخر: ring, sing."],
      [g("nk"), "w:pink", "nk صوتها «نك» من الأنف: pink, bank."],
    ],
    readable: ["shop", "ship", "fish", "shed", "chip", "chin", "chat", "rich", "thin", "thick", "thing", "math", "this", "that", "then", "them", "back", "sock", "duck", "neck", "kick", "sick", "ring", "sing", "king", "pink", "sink", "bank", "think", "den"],
    pseudo: ["shom", "chep", "thub", "lenk", "rish"],
    contrasts: [["thing", "sing"], ["thick", "sick"], ["then", "den"]],
    spell: ["ship", "fish", "chat", "duck", "ring"],
    oral: { chunks: ["ch:sorry-repeat"] },
    builds: [["sw:I", W("think"), "p:full-stop"], ["sw:I", W("can"), W("sing"), "p:full-stop"]],
  },
  {
    id: "z0-u1-l7",
    index: 7,
    title: "st bl tr nd",
    titleAr: "حرفين ساكنين مع بعض",
    objectivesAr: ["أقرأ كلمات تبدأ بحرفين ساكنين مثل stop و flag", "أقرأ كلمات تنتهي بحرفين ساكنين مثل hand و fast", "أنطق stop بدون حرف زايد قبلها"],
    minutes: 30,
    graphemes: [],
    extra: [
      [
        ONSETS.filter((c) => c.startsWith("s")).map((c) => `p:onset-${c}` as ItemId),
        "st sp sn sm sl sw: صوتين ساكنين ورا بعض بدون حركة بينهم. انتبه: نقول stop مو «إستوب». لا تحط حرف قبل الـ s.",
      ],
      [ONSETS.filter((c) => /^[bcfgp]l$/.test(c)).map((c) => `p:onset-${c}` as ItemId), "bl cl fl gl pl: الصوت الأول ثم l مباشرة: black, flag."],
      [ONSETS.filter((c) => /r$/.test(c)).map((c) => `p:onset-${c}` as ItemId), "br cr dr fr gr tr thr: الصوت الأول ثم r مباشرة بدون حركة: crab, trip, three."],
      [CODAS.map((c) => `p:coda-${c}` as ItemId), "-st -nd -nt -mp -sk -ft في آخر الكلمة: انطق الصوتين، لا تبلع الأخير: hand, tent, fast."],
    ],
    readable: ["stop", "spot", "snap", "step", "slip", "swim", "black", "clap", "flag", "glad", "plan", "brick", "crab", "drum", "grin", "trip", "ant", "hand", "tent", "lamp", "desk", "gift", "fast", "best"],
    pseudo: ["stip", "blon", "frum", "glet", "trem"],
    contrasts: [],
    spell: ["stop", "swim", "flag", "crab", "hand", "tent"],
    oral: { chunks: ["ch:where-from", "ch:im-from"] },
    builds: [["sw:I", W("swim"), "p:full-stop"], ["sw:I", W("can"), W("swim"), W("fast"), "p:full-stop"]],
    more: (L) => [say(L, [W("stop")]), say(L, [W("step")])],
  },
  {
    id: "z0-u1-l8",
    index: 8,
    title: "ee oo a_e i_e o_e",
    titleAr: "الحروف الطويلة والجمع",
    objectivesAr: ["أقرأ ee و oo و a_e و i_e و o_e", "أعرف أن s أحياناً صوتها «ز» (is, nose)", "أجمع بإضافة s: cat → cats"],
    minutes: 30,
    graphemes: [
      [g("ee"), "w:sheep", "ee صوتها «إي» طويلة: see, tree, sheep."],
      [g("oo"), "w:moon", "oo صوتها «أو» طويلة: moon, food."],
      [g("a_e"), "w:cake", "a…e: الـ e في الآخر ما تنطق، لكنها تخلي a تقول اسمها «إيه»: cap → cape."],
      [g("i_e"), "w:kite", "i…e: الـ e الأخيرة تخلي i تقول اسمها «آي»: pin → pine."],
      [g("o_e"), "w:home", "o…e: الـ e الأخيرة تخلي o تقول اسمها «أو»: hop → hope."],
      [g("s/z"), "w:nose", "s أحياناً صوتها «ز»: is, his, nose."],
    ],
    extra: [[["p:plural-s"], "الجمع: نضيف s. بعد t و p و k صوتها «س» (cats)، وبعد n و d و g صوتها «ز» (pens)."]],
    readable: ["see", "three", "green", "sheep", "tree", "moon", "food", "too", "spoon", "name", "cake", "make", "cape", "five", "nine", "time", "like", "pine", "kite", "home", "bone", "nose", "hope", "is", "his", "cats", "pens"],
    pseudo: ["veem", "gake", "fime", "lote", "poom"],
    contrasts: [["cap", "cape"], ["pin", "pine"], ["hop", "hope"]],
    spell: ["see", "tree", "cake", "five", "home", "nose"],
    oral: { chunks: ["ch:nice-to-meet-you"] },
    builds: [
      ["sw:I", W("like"), W("cake"), "p:full-stop"],
      ["sw:I", W("see"), W("three"), W("cats"), "p:full-stop"],
      [W("his"), W("name"), W("is"), "w:name-nat", "p:full-stop"],
    ],
  },
];

// ---------- generation ----------

function generate(spec: Spec, pools: { readable: string[]; pseudo: string[]; graphemes: GraphemeId[]; pictured: string[] }): Stage0Lesson {
  const L = spec.id;
  counter = 0;
  const steps: Step[] = [];

  for (const [gid, keyword, explainAr] of spec.graphemes) {
    steps.push(teach(L, [gid], explainAr, keyword));
    pools.graphemes.push(gid);
    if (pools.graphemes.length >= 3) steps.push(soundPick(L, gid, pools.graphemes, steps.length));
  }
  for (const [ids, explainAr] of spec.extra ?? []) steps.push(teach(L, ids, explainAr));

  const readable = spec.readable.map(W);
  pools.readable.push(...readable);
  pools.pseudo.push(...spec.pseudo.map((p) => `pw:${p}`));
  pools.pictured.push(...readable.filter((id) => imageOf(id)));
  const spelledPool = [...pools.readable, ...pools.pseudo];

  // Blending: model two words (text + audio = exposure), then the learner decodes on their own.
  if (readable.length) steps.push(show(L, [readable[0]], "اسمع كيف نجمع الأصوات: صوت صوت ثم الكلمة كاملة."));
  for (const id of readable) steps.push(decodePick(L, id, spelledPool));
  readable.filter((id) => imageOf(id)).forEach((id, i) => steps.push(readPick(L, id, pools.pictured, i)));
  for (const p of spec.pseudo) steps.push(decodePick(L, `pw:${p}`, spelledPool));
  for (const [a, b] of spec.contrasts) steps.push(...contrast(L, W(a), W(b)));
  for (const s of spec.spell) steps.push(spell(L, W(s)));

  const chunks = spec.oral.chunks;
  chunks.forEach((c, i) => {
    steps.push(show(L, [c]));
    if (chunks.length > 2) steps.push(listenPick(L, c, chunks, i + 1));
  });
  if (chunks.length && chunks.length <= 3) steps.push(say(L, chunks.filter((c) => !c.startsWith("ch:num"))));
  for (const b of spec.builds) steps.push(build(L, b));
  steps.push(...(spec.more?.(L) ?? []));

  return { id: L, unit: 1, index: spec.index, title: spec.title, titleAr: spec.titleAr, objectivesAr: spec.objectivesAr, minutes: spec.minutes, steps };
}

const welcome: Stage0Lesson = (() => {
  const L = "z0-u0-l1";
  counter = 0;
  return {
    id: L,
    unit: 0,
    index: 1,
    title: "Welcome",
    titleAr: "أهلاً فيك",
    objectivesAr: ["أعرف كيف تشتغل الدروس", "أعرف أن الإنجليزي ينقرأ من اليسار لليمين", "أعرف أن التحدث اختياري وما فيه تصحيح آلي للنطق"],
    minutes: 5,
    steps: [
      teach(L, ["p:reading-direction"], "الإنجليزي ينقرأ وينكتب من اليسار لليمين، عكس العربي. ● ▲ ■ ← تابع الأشكال من اليسار."),
      teach(L, [], "كل تمرين له زر صوت 🔊. بعض التمارين تخفي الصوت لين تجاوب: هذا عشان نعرف إنك قرأت بنفسك."),
      teach(L, [], "التحدث اختياري. تقدر تتخطاه في أي درس، وما راح نحكم على نطقك آلياً."),
      show(L, ["ch:hello"]),
      listenPick(L, "ch:hello", ["ch:hello", "ch:thank-you"], 1),
    ],
  };
})();

/** Unit 1 check: every part scored separately. */
function unitCheck(pools: { readable: string[]; pseudo: string[] }): Stage0Lesson {
  const L = "z0-u1-check";
  counter = 0;
  const single = GRAPHEMES.filter((x) => /^[a-z]$/.test(x.spelling) && !x.id.includes("/")).map((x) => x.id);
  const digraphs = (["sh", "ch", "th", "ck", "ng", "nk", "qu"] as const).map(g);
  const steps: Step[] = [];
  [...single, ...digraphs].forEach((id, i) => steps.push(soundPick(L, id, [...single, ...digraphs], i)));
  const letters = Object.keys(LETTER_NAMES);
  letters.forEach((letter, i) =>
    steps.push({
      id: sid(L),
      type: "namePick",
      dimension: "WF",
      ar: "اسمع اسم الحرف واختر الحرف.",
      letter,
      options: [letter, letters[(i + 5) % 26], letters[(i + 11) % 26]],
      wrongAr: `اسم الحرف ${letter.toUpperCase()} هو «${LETTER_NAMES[letter].ar}».`,
    }),
  );
  const spelledPool = [...pools.readable, ...pools.pseudo];
  // Decoding: 12 readable words spread over the unit + 6 pseudo-words.
  const sample = pools.readable.filter((_, i) => i % Math.floor(pools.readable.length / 12) === 0).slice(0, 12);
  for (const id of sample) steps.push(decodePick(L, id, spelledPool));
  for (const p of ["pw:tas", "pw:hib", "pw:zun", "pw:chep", "pw:frum", "pw:fime"]) steps.push(decodePick(L, p, spelledPool));
  for (const [a, b] of [["pin", "bin"], ["van", "fan"], ["thick", "sick"], ["hat", "hut"], ["pen", "pin"], ["hop", "hope"]] as const)
    steps.push(contrast(L, W(a), W(b))[0]);
  for (const s of ["map", "bed", "fish", "flag", "cake", "home"]) steps.push(spell(L, W(s)));
  return {
    id: L,
    unit: 1,
    index: 9,
    title: "Unit 1 check",
    titleAr: "اختبار الوحدة الأولى",
    objectivesAr: ["أعرف أصوات الحروف وأسماءها", "أقرأ كلمات وكلمات مو حقيقية بنفسي", "أفرّق بالسمع بين الأصوات المتقاربة", "أكتب كلمات أسمعها"],
    minutes: 20,
    steps,
  };
}

const pools = { readable: [] as string[], pseudo: [] as string[], graphemes: [] as GraphemeId[], pictured: [] as string[] };
const unit1 = SPECS.map((s) => generate(s, pools));

/** Stage 0 lessons in learning order. Not yet on any learner's path (behind flags.stage0). */
export const stage0Lessons: Stage0Lesson[] = [welcome, ...unit1, unitCheck(pools)];

export { sentence as sentenceText };
