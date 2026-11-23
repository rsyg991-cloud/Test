/**
 * Stage 0 items: words, pseudo-words, sight words, chunks and patterns.
 * Pronunciation is General American. Images are emoji placeholders until the illustration source is
 * chosen (Figma vectors or an illustrator); `image` is omitted where no emoji is unambiguous.
 *
 * Content rules (checked by tests/stage0-content.test.ts):
 * - a word used as a decoding exemplar spells correctly from its graphemes and has one vowel sound;
 * - "dog", "long", "ball", "egg" and other irregular or multi-syllable words are keyword/supported only;
 * - pseudo-words are hand-picked, never real or offensive words;
 * - no pig or pork imagery, alcohol or other content unsuitable for the audience.
 */
import type { ChunkItem, GraphemeId, PatternItem, PseudoWordItem, SightWordItem, WordItem } from "../items";

const ids = (gpc: string): GraphemeId[] => (gpc ? gpc.split(" ").map((x) => `g:${x}` as GraphemeId) : []);

function w(text: string, gpc: string, ipa: string, ar: string, image?: string, extra: Partial<WordItem> = {}): WordItem {
  return { kind: "word", id: `w:${text.toLowerCase()}`, text, gpc: ids(gpc), ipa, ar, ...(image ? { image } : {}), ...extra };
}
/** A keyword or listen-first word that is never a decoding exemplar in Stage 0. */
const kw = (text: string, ipa: string, ar: string, image?: string) => w(text, "", ipa, ar, image, { decodable: false });
const pw = (text: string, gpc: string, ipa: string): PseudoWordItem => ({ kind: "pseudo", id: `pw:${text}`, text, gpc: ids(gpc), ipa });

export const WORDS: WordItem[] = [
  // ---- l1: s a t p i n
  w("at", "a t", "æt", "عند / في"),
  w("it", "i t", "ɪt", "هو / هي (لغير العاقل)"),
  w("in", "i n", "ɪn", "في / داخل"),
  w("sat", "s a t", "sæt", "جلس"),
  w("sit", "s i t", "sɪt", "يجلس", "🪑"),
  w("tap", "t a p", "tæp", "حنفية", "🚰"),
  w("pan", "p a n", "pæn", "مقلاة", "🍳"),
  w("pin", "p i n", "pɪn", "دبوس", "📌"),
  w("tin", "t i n", "tɪn", "علبة معدنية", "🥫"),
  w("nap", "n a p", "næp", "قيلولة", "😴"),
  w("pat", "p a t", "pæt", "يربّت"),
  w("tip", "t i p", "tɪp", "طرف / رأس الشيء"),
  w("pit", "p i t", "pɪt", "حفرة"),
  w("tan", "t a n", "tæn", "سُمرة (لون)"),
  { ...w("Nat", "n a t", "næt", "نات (اسم)", "🧑"), id: "w:name-nat" },
  { ...w("Pat", "p a t", "pæt", "بات (اسم)", "👩"), id: "w:name-pat" },
  // Keywords for l1 letters. sun and net become readable in l3, ant in l7 (its -nt cluster).
  w("sun", "s u n", "sʌn", "شمس", "☀️"),
  kw("insect", "ˈɪnsɛkt", "حشرة", "🐞"),
  w("net", "n e t", "nɛt", "شبكة", "🥅"),
  // ---- l2: m d g o c k
  w("map", "m a p", "mæp", "خريطة", "🗺️"),
  w("man", "m a n", "mæn", "رجل", "👨"),
  w("mat", "m a t", "mæt", "سجادة صغيرة"),
  w("dad", "d a d", "dæd", "بابا"),
  w("dig", "d i g", "dɪɡ", "يحفر", "⛏️"),
  w("got", "g o t", "ɡɑt", "حصل على (ماضي)"),
  w("top", "t o p", "tɑp", "قمّة / فوق", "🔝"),
  w("pot", "p o t", "pɑt", "قِدر", "🍲"),
  w("mop", "m o p", "mɑp", "ممسحة"),
  w("cat", "c a t", "kæt", "قطة", "🐱"),
  w("can", "c a n", "kæn", "يقدر / علبة"),
  w("cap", "c a p", "kæp", "طاقية", "🧢"),
  w("cot", "c o t", "kɑt", "سرير أطفال"),
  w("kid", "k i d", "kɪd", "طفل", "🧒"),
  w("kit", "k i t", "kɪt", "عُدّة", "🧰"),
  w("dim", "d i m", "dɪm", "خافت"),
  w("mad", "m a d", "mæd", "زعلان", "😠"),
  // Keywords for l2 letters. moon (l8), duck (l6) and kite (l8) become readable later.
  kw("goat", "ɡoʊt", "ماعز", "🐐"),
  kw("octopus", "ˈɑktəpʊs", "أخطبوط", "🐙"),
  // General American vowel is /ɔ/ for many speakers, not the taught short o: never a decoding exemplar.
  kw("dog", "dɔɡ", "كلب", "🐶"),
  // ---- l3: e u r h b f
  w("pen", "p e n", "pɛn", "قلم", "🖊️"),
  w("ten", "t e n", "tɛn", "عشرة", "🔟"),
  w("bed", "b e d", "bɛd", "سرير", "🛏️"),
  w("red", "r e d", "ɹɛd", "أحمر", "🟥"),
  w("hen", "h e n", "hɛn", "دجاجة", "🐔"),
  w("bus", "b u s", "bʌs", "باص", "🚌"),
  w("cup", "c u p", "kʌp", "كوب", "☕"),
  w("mug", "m u g", "mʌɡ", "كوب كبير"),
  w("run", "r u n", "ɹʌn", "يجري", "🏃"),
  w("hat", "h a t", "hæt", "قبعة", "🎩"),
  w("hot", "h o t", "hɑt", "حار", "🔥"),
  w("hut", "h u t", "hʌt", "كوخ", "🛖"),
  w("bat", "b a t", "bæt", "خفاش", "🦇"),
  w("bin", "b i n", "bɪn", "سلة مهملات", "🗑️"),
  w("big", "b i g", "bɪɡ", "كبير"),
  w("fan", "f a n", "fæn", "مروحة", "🪭"),
  w("fun", "f u n", "fʌn", "متعة", "🎉"),
  w("fig", "f i g", "fɪɡ", "تين"),
  w("rug", "r u g", "ɹʌɡ", "سجادة"),
  w("hop", "h o p", "hɑp", "يقفز"),
  kw("egg", "ɛɡ", "بيضة", "🥚"),
  kw("umbrella", "ʌmˈbɹɛlə", "شمسية / مظلة", "☂️"),
  kw("rabbit", "ˈɹæbɪt", "أرنب", "🐇"),
  kw("ball", "bɔl", "كرة", "⚽"),
  // ---- l4: l j v w y z x qu
  w("leg", "l e g", "lɛɡ", "رِجل", "🦵"),
  w("lip", "l i p", "lɪp", "شفة", "👄"),
  w("jam", "j a m", "dʒæm", "مربى"),
  w("jet", "j e t", "dʒɛt", "طائرة نفاثة", "✈️"),
  w("jug", "j u g", "dʒʌɡ", "إبريق", "🫖"),
  w("van", "v a n", "væn", "فان (سيارة)", "🚐"),
  w("vet", "v e t", "vɛt", "طبيب بيطري"),
  w("web", "w e b", "wɛb", "شبكة عنكبوت", "🕸️"),
  w("wet", "w e t", "wɛt", "مبلول", "💦"),
  w("win", "w i n", "wɪn", "يفوز", "🏆"),
  w("yes", "y e s", "jɛs", "نعم", "👍"),
  w("yum", "y u m", "jʌm", "لذيذ", "😋"),
  w("zip", "z i p", "zɪp", "سحّاب"),
  w("box", "b o x", "bɑks", "صندوق", "📦"),
  w("six", "s i x", "sɪks", "ستة", "6️⃣"),
  w("fox", "f o x", "fɑks", "ثعلب", "🦊"),
  w("quiz", "qu i z", "kwɪz", "اختبار قصير"),
  kw("lion", "ˈlaɪən", "أسد", "🦁"),
  kw("zebra", "ˈziːbɹə", "حمار وحشي", "🦓"),
  { ...kw("yo-yo", "ˈjoʊjoʊ", "يويو", "🪀"), id: "w:yoyo" },
  // ---- l6: sh ch th th/ð ck ng nk
  w("shop", "sh o p", "ʃɑp", "محل", "🏪"),
  w("ship", "sh i p", "ʃɪp", "سفينة", "🚢"),
  w("fish", "f i sh", "fɪʃ", "سمكة", "🐟"),
  w("shed", "sh e d", "ʃɛd", "مخزن صغير"),
  w("chip", "ch i p", "tʃɪp", "شريحة"),
  w("chin", "ch i n", "tʃɪn", "ذقن"),
  w("chat", "ch a t", "tʃæt", "دردشة", "💬"),
  w("rich", "r i ch", "ɹɪtʃ", "غني", "💰"),
  w("thin", "th i n", "θɪn", "نحيف / رقيق"),
  w("thick", "th i ck", "θɪk", "سميك"),
  w("thing", "th i ng", "θɪŋ", "شيء"),
  w("math", "m a th", "mæθ", "رياضيات", "➗"),
  w("this", "th/ð i s", "ðɪs", "هذا"),
  w("that", "th/ð a t", "ðæt", "ذلك"),
  w("then", "th/ð e n", "ðɛn", "بعدين / ثم"),
  w("them", "th/ð e m", "ðɛm", "هم (مفعول به)"),
  w("den", "d e n", "dɛn", "عرين"),
  w("back", "b a ck", "bæk", "ظهر / خلف"),
  w("sock", "s o ck", "sɑk", "جوراب", "🧦"),
  w("duck", "d u ck", "dʌk", "بطة", "🦆"),
  w("neck", "n e ck", "nɛk", "رقبة"),
  w("kick", "k i ck", "kɪk", "يركل"),
  w("sick", "s i ck", "sɪk", "مريض", "🤒"),
  w("ring", "r i ng", "ɹɪŋ", "خاتم", "💍"),
  w("sing", "s i ng", "sɪŋ", "يغني", "🎤"),
  w("king", "k i ng", "kɪŋ", "ملك", "👑"),
  w("pink", "p i nk", "pɪŋk", "وردي", "🩷"),
  w("sink", "s i nk", "sɪŋk", "مغسلة"),
  w("bank", "b a nk", "bæŋk", "بنك", "🏦"),
  w("think", "th i nk", "θɪŋk", "يفكر", "🤔"),
  // Like "dog": the General American vowel is /ɔ/ for many speakers.
  kw("long", "lɔŋ", "طويل"),
  // ---- l7: clusters
  w("stop", "s t o p", "stɑp", "قِف", "🛑"),
  w("spot", "s p o t", "spɑt", "بقعة"),
  w("snap", "s n a p", "snæp", "طقطقة"),
  w("step", "s t e p", "stɛp", "خطوة", "👣"),
  w("slip", "s l i p", "slɪp", "ينزلق"),
  w("swim", "s w i m", "swɪm", "يسبح", "🏊"),
  w("black", "b l a ck", "blæk", "أسود", "⬛"),
  w("clap", "c l a p", "klæp", "يصفّق", "👏"),
  w("flag", "f l a g", "flæɡ", "علم", "🚩"),
  w("glad", "g l a d", "ɡlæd", "مسرور", "😊"),
  w("plan", "p l a n", "plæn", "خطة", "📝"),
  w("brick", "b r i ck", "bɹɪk", "طوبة", "🧱"),
  w("crab", "c r a b", "kɹæb", "سلطعون", "🦀"),
  w("drum", "d r u m", "dɹʌm", "طبل", "🥁"),
  w("grin", "g r i n", "ɡɹɪn", "ابتسامة عريضة", "😁"),
  w("trip", "t r i p", "tɹɪp", "رحلة", "🧳"),
  w("ant", "a n t", "ænt", "نملة", "🐜"),
  w("hand", "h a n d", "hænd", "يد", "✋"),
  w("tent", "t e n t", "tɛnt", "خيمة", "⛺"),
  w("lamp", "l a m p", "læmp", "مصباح", "🪔"),
  w("desk", "d e s k", "dɛsk", "مكتب (طاولة)"),
  w("gift", "g i f t", "ɡɪft", "هدية", "🎁"),
  w("fast", "f a s t", "fæst", "سريع", "💨"),
  w("best", "b e s t", "bɛst", "الأفضل", "🥇"),
  // ---- l8: long vowels, s = /z/, plural -s
  w("see", "s ee", "siː", "يرى", "👀"),
  w("three", "th r ee", "θɹiː", "ثلاثة", "3️⃣"),
  w("green", "g r ee n", "ɡɹiːn", "أخضر", "🟩"),
  w("sheep", "sh ee p", "ʃiːp", "خروف", "🐑"),
  w("tree", "t r ee", "tɹiː", "شجرة", "🌳"),
  w("moon", "m oo n", "muːn", "قمر", "🌙"),
  w("food", "f oo d", "fuːd", "أكل", "🍽️"),
  w("too", "t oo", "tuː", "أيضاً"),
  w("spoon", "s p oo n", "spuːn", "ملعقة", "🥄"),
  w("name", "n a_e m", "neɪm", "اسم", "🏷️"),
  w("cake", "c a_e k", "keɪk", "كيكة", "🎂"),
  w("make", "m a_e k", "meɪk", "يصنع"),
  w("cape", "c a_e p", "keɪp", "رداء"),
  w("five", "f i_e v", "faɪv", "خمسة", "5️⃣"),
  w("nine", "n i_e n", "naɪn", "تسعة", "9️⃣"),
  w("time", "t i_e m", "taɪm", "وقت", "⏰"),
  w("like", "l i_e k", "laɪk", "يحب", "❤️"),
  w("pine", "p i_e n", "paɪn", "صنوبر", "🌲"),
  w("kite", "k i_e t", "kaɪt", "طائرة ورقية", "🪁"),
  w("home", "h o_e m", "hoʊm", "بيت", "🏠"),
  w("bone", "b o_e n", "boʊn", "عظمة", "🦴"),
  w("nose", "n o_e s/z", "noʊz", "أنف", "👃"),
  w("hope", "h o_e p", "hoʊp", "أمل"),
  w("is", "i s/z", "ɪz", "يكون (هو / هي)"),
  w("his", "h i s/z", "hɪz", "حقّه / له"),
  w("cats", "c a t s", "kæts", "قطط", "🐱🐱", { plural: true }),
  w("pens", "p e n s/z", "pɛnz", "أقلام", "🖊️🖊️", { plural: true }),
  { ...kw("dogs", "dɔɡz", "كلاب", "🐶🐶"), plural: true },
  // ---- Unit 2: first sentences
  w("mum", "m u m", "mʌm", "ماما", "👩"),
  w("not", "n o t", "nɑt", "مو / ليس"),
  w("on", "o n", "ɑn", "على"),
  w("up", "u p", "ʌp", "فوق", "⬆️"),
  w("has", "h a s/z", "hæz", "عنده"),
  w("him", "h i m", "hɪm", "هو (مفعول به)"),
  w("bag", "b a g", "bæɡ", "شنطة", "👜"),
  w("am", "a m", "æm", "أكون (مع I)"),
  w("and", "a n d", "ænd", "و"),
  w("pet", "p e t", "pɛt", "حيوان أليف"),
  w("pool", "p oo l", "puːl", "مسبح", "🏊"),
  w("drive", "d r i_e v", "dɹaɪv", "يسوق", "🚗"),
  { ...w("Sam", "s a m", "sæm", "سام (اسم)", "🧔"), id: "w:name-sam" },
  // Mum and Dad used as names (capital letter inside a sentence).
  { ...w("Mum", "m u m", "mʌm", "ماما", "👩"), id: "w:name-mum" },
  { ...w("Dad", "d a d", "dæd", "بابا", "👨"), id: "w:name-dad" },
  // Colours whose spelling isn't decodable yet: always shown with audio.
  kw("blue", "bluː", "أزرق", "🟦"),
  kw("yellow", "ˈjɛloʊ", "أصفر", "🟨"),
  kw("white", "waɪt", "أبيض", "⬜"),
];

/**
 * One entry per word. A word used as an early keyword (ant for "a") is the same item that becomes a
 * decoding exemplar later: lib/phonics keeps it hidden until its last grapheme or cluster is taught.
 */
export const wordById = new Map(WORDS.map((x) => [x.id, x]));

export const PSEUDO_WORDS: PseudoWordItem[] = [
  pw("tas", "t a s", "tæs"),
  pw("nin", "n i n", "nɪn"),
  pw("nis", "n i s", "nɪs"),
  pw("ip", "i p", "ɪp"),
  pw("ap", "a p", "æp"),
  pw("dop", "d o p", "dɑp"),
  pw("pid", "p i d", "pɪd"),
  pw("kam", "k a m", "kæm"),
  pw("nim", "n i m", "nɪm"),
  pw("rup", "r u p", "ɹʌp"),
  pw("bem", "b e m", "bɛm"),
  pw("hib", "h i b", "hɪb"),
  pw("dut", "d u t", "dʌt"),
  pw("fep", "f e p", "fɛp"),
  pw("vop", "v o p", "vɑp"),
  pw("jit", "j i t", "dʒɪt"),
  pw("wem", "w e m", "wɛm"),
  pw("zun", "z u n", "zʌn"),
  pw("lub", "l u b", "lʌb"),
  pw("quep", "qu e p", "kwɛp"),
  pw("shom", "sh o m", "ʃɑm"),
  pw("chep", "ch e p", "tʃɛp"),
  pw("thub", "th u b", "θʌb"),
  pw("lenk", "l e nk", "lɛŋk"),
  pw("rish", "r i sh", "ɹɪʃ"),
  pw("stip", "s t i p", "stɪp"),
  pw("blon", "b l o n", "blɑn"),
  pw("frum", "f r u m", "fɹʌm"),
  pw("glet", "g l e t", "ɡlɛt"),
  pw("trem", "t r e m", "tɹɛm"),
  pw("veem", "v ee m", "viːm"),
  pw("gake", "g a_e k", "ɡeɪk"),
  pw("fime", "f i_e m", "faɪm"),
  pw("lote", "l o_e t", "loʊt"),
  pw("poom", "p oo m", "puːm"),
];

const sw = (text: string, ipa: string, ar: string): SightWordItem => ({ kind: "sightWord", id: `sw:${text}`, text, ipa, ar });

/** Irregular high-frequency words, taught as whole shapes (the tricky part is explained in Arabic). */
export const SIGHT_WORDS: SightWordItem[] = [
  sw("I", "aɪ", "أنا"),
  sw("a", "ə", "أداة نكرة (واحد)"),
  sw("the", "ðə", "الـ (أداة تعريف)"),
  sw("my", "maɪ", "حقّي / لي"),
  sw("you", "juː", "أنت"),
  sw("he", "hiː", "هو"),
  sw("she", "ʃiː", "هي"),
  sw("we", "wiː", "نحن"),
  sw("are", "ɑɹ", "يكونون / تكون (مع you و we)"),
  sw("have", "hæv", "عندي / عندنا"),
  sw("no", "noʊ", "لا"),
];

const ch = (id: string, text: string, ar: string, image?: string): ChunkItem & { image?: string } => ({
  kind: "chunk",
  id: `ch:${id}`,
  text,
  ar,
  ...(image ? { image } : {}),
});

/** Listen-first expressions: always shown with audio and an Arabic gloss, never tested as reading. */
export const CHUNKS: (ChunkItem & { image?: string })[] = [
  ch("hello", "Hello", "مرحبا", "👋"),
  ch("hi", "Hi", "هلا", "👋"),
  ch("im", "I'm", "أنا (اختصار I am)"),
  ch("whats-your-name", "What's your name?", "وش اسمك؟"),
  ch("bye", "Bye", "مع السلامة", "👋"),
  ch("thank-you", "Thank you", "شكراً", "🙏"),
  ch("how-are-you", "How are you?", "كيف حالك؟"),
  ch("im-fine", "I'm fine, thanks.", "أنا بخير، شكراً"),
  ch("can-you-spell-it", "Can you spell it?", "ممكن تتهجّاه؟"),
  ch("sorry-repeat", "Sorry, can you repeat that, please?", "آسف، ممكن تعيد لو سمحت؟"),
  ch("where-from", "Where are you from?", "من وين أنت؟"),
  ch("im-from", "I'm from Saudi Arabia.", "أنا من السعودية"),
  ch("nice-to-meet-you", "Nice to meet you.", "تشرفت بمعرفتك"),
  ...["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"].map((n, i) =>
    ch(`num-${i + 1}`, n, `الرقم ${i + 1}`, String(i + 1)),
  ),
];

const pt = (id: string, label: string, ar: string): PatternItem => ({ kind: "pattern", id: `p:${id}`, label, ar });

export const ONSETS = ["st", "sp", "sn", "sm", "sl", "sw", "bl", "cl", "fl", "gl", "pl", "br", "cr", "dr", "fr", "gr", "tr", "thr"];
export const CODAS = ["st", "nd", "nt", "mp", "sk", "ft"];

export const PATTERNS: PatternItem[] = [
  pt("full-stop", ".", "النقطة: نهاية الجملة"),
  pt("exclamation", "!", "علامة التعجب: حماس أو تحية"),
  pt("apostrophe", "'", "الفاصلة العلوية: تختصر حرف (I'm = I am)"),
  pt("question-mark", "?", "علامة الاستفهام: سؤال"),
  pt("comma", ",", "الفاصلة: وقفة قصيرة داخل الجملة"),
  pt("reading-direction", "left → right", "الإنجليزي ينقرأ من اليسار لليمين"),
  pt("capital-letters", "Capital letters", "الحرف الكبير: أول الجملة، الأسماء، والكلمة I"),
  pt("letter-names", "Letter names A–Z", "اسم الحرف غير صوته: b اسمه 'بي' وصوته 'بْ'"),
  pt("plural-s", "plural -s", "الجمع: نضيف s في آخر الكلمة (cat → cats)"),
  ...ONSETS.map((c) => pt(`onset-${c}`, `${c}-`, `حرفين ساكنين في البداية بدون حركة بينهم: ${c}`)),
  ...CODAS.map((c) => pt(`coda-${c}`, `-${c}`, `حرفين ساكنين في النهاية: ${c}`)),
];
