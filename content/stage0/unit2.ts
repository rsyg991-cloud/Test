/**
 * Stage 0, Unit 2: first sentences and first texts (Pre-A1). Builds on Unit 1's sounds with ten
 * high-frequency sight words (a, my, have, he, she, we, you, are, no, the). Every sentence is made
 * only of readable words, taught sight words and explained punctuation (checked by the tests), and
 * reading is checked for meaning with picture or Arabic answers, the target's audio held back.
 */
import type { ItemId } from "../items";
import { arOf, build, en, imageOf, listenPick, resetSteps, say, sentence, show, sid, stage0ItemById, teach } from "./builders";
import type { Stage0Lesson, Step } from "./types";

/** Turns "This is a cat." into item ids (sight words first, then words, names and punctuation). */
export function toks(text: string): ItemId[] {
  const parts = text.match(/[A-Za-z'-]+|[.!?,]/g) ?? [];
  return parts.map((p): ItemId => {
    const punct: Record<string, ItemId> = { ".": "p:full-stop", "!": "p:exclamation", "?": "p:question-mark", ",": "p:comma" };
    if (punct[p]) return punct[p];
    const candidates = [`sw:${p}`, `sw:${p.toLowerCase()}`, `w:name-${p.toLowerCase()}`, `w:${p.toLowerCase()}`];
    const id = candidates.find((c) => stage0ItemById.has(c) && (!c.startsWith("w:name-") || /^[A-Z]/.test(p)));
    if (!id) throw new Error(`No Stage 0 item for "${p}" in "${text}"`);
    return id as ItemId;
  });
}

/** Read a sentence or text (audio held back), choose the picture or meaning. */
function readSentence(L: string, text: string, target: ItemId, others: ItemId[], ar = "اقرأ بدون صوت، واختر الصورة أو المعنى الصحيح."): Step {
  const tokens = toks(text);
  const meaning = arOf(target) || "";
  return {
    id: sid(L),
    type: "readSentence",
    dimension: "MC-R",
    ar,
    tokens,
    target,
    options: [target, ...others],
    wrongAr: `اقرأها كلمة كلمة: «${en(sentence(tokens))}». الجواب الصحيح: ${meaning}${imageOf(target) ? ` ${imageOf(target)}` : ""}.`,
  };
}

const W = (w: string) => `w:${w}` as ItemId;
const M = (m: string) => `m:${m}` as ItemId;

function lesson(id: string, index: number, title: string, titleAr: string, objectivesAr: string[], minutes: number, steps: (L: string) => Step[]): Stage0Lesson {
  resetSteps();
  return { id, unit: 2, index, title, titleAr, objectivesAr, minutes, steps: steps(id) };
}

export function unit2Lessons(): Stage0Lesson[] {
  return [
    lesson("z0-u2-l1", 1, "This is a…", "هذا…", ["أقرأ الكلمة a وأفهم معناها", "أقرأ جملة: This is a cat.", "أكوّن جملة عن شيء أشوفه"], 20, (L) => [
      teach(L, ["sw:a"], "a معناها «واحد» قبل اسم الشيء: a cat = قطة. نطقها خفيف «أَ»، مو «إيه» مثل اسم الحرف."),
      show(L, toks("This is a cat.")),
      readSentence(L, "This is a cat.", W("cat"), [W("hat"), W("bat")]),
      readSentence(L, "This is a hat.", W("hat"), [W("cat"), W("pen")]),
      readSentence(L, "This is a bus.", W("bus"), [W("van"), W("box")]),
      readSentence(L, "It is a pen.", W("pen"), [W("pin"), W("cup")]),
      readSentence(L, "It is a fish.", W("fish"), [W("ship"), W("sock")]),
      readSentence(L, "This is a bed.", W("bed"), [W("tent"), W("bag")]),
      build(L, toks("This is a bag.")),
      build(L, toks("It is a cup.")),
      say(L, toks("This is a pen.")),
    ]),
    lesson("z0-u2-l2", 2, "I have… My…", "عندي… حقّي…", ["أقرأ my و have", "أقول وش عندي: I have a bag.", "أوصف أغراضي: My hat is red."], 20, (L) => [
      teach(L, ["sw:my"], "my معناها «حقّي». نطقها «ماي»: الـ y في آخرها هنا تقول «آي»."),
      teach(L, ["sw:have"], "have معناها «عندي». الـ e في آخرها ما تنطق، والـ a قصيرة: «هَڤ»."),
      show(L, toks("I have a bag.")),
      readSentence(L, "I have a bag.", W("bag"), [W("cap"), W("box")]),
      readSentence(L, "I have a cat.", W("cat"), [W("bat"), W("fish")]),
      readSentence(L, "My hat is red.", M("hat-red"), [M("hat-black"), M("cap-red")]),
      readSentence(L, "I have a pen.", W("pen"), [W("cup"), W("ring")]),
      build(L, toks("I have a pen.")),
      build(L, toks("My bag is big.")),
      say(L, toks("My name is Nat.")),
    ]),
    lesson("z0-u2-l3", 3, "He, she, we, you", "هو، هي، نحن، أنت", ["أقرأ he و she و we و you و are", "أفرّق بين he و she", "أقول we are و you are"], 20, (L) => [
      teach(L, ["sw:he", "sw:she"], "he = هو، she = هي. الـ e في آخرهم تقول اسمها «إي»: «هي»، «شي»."),
      teach(L, ["sw:we", "sw:you", "sw:are"], "we = نحن، you = أنت. معهم نقول are مو is: we are, you are. ونطق are «آر»."),
      show(L, toks("She has a cat.")),
      readSentence(L, "He has a hat.", M("he-hat"), [M("she-hat"), M("he-cat")]),
      readSentence(L, "She has a fish.", M("she-fish"), [M("he-fish"), M("she-cat")]),
      readSentence(L, "We are in a tent.", M("we-tent"), [M("we-bus"), M("we-shop")]),
      readSentence(L, "You are sick.", M("you-sick"), [M("you-glad"), M("you-hot")]),
      build(L, toks("She is my mum.")),
      build(L, toks("We are glad.")),
      say(L, toks("We are in a tent.")),
    ]),
    lesson("z0-u2-l4", 4, "Is it…? Yes. No.", "هل هو…؟ إيه. لا.", ["أقرأ سؤال فيه علامة ?", "أجاوب بـ Yes و No", "أقرأ جملة فيها not"], 20, (L) => [
      teach(L, ["p:question-mark", "p:comma", "sw:no"], "«?» علامة سؤال: Is it a cat? نجاوب: Yes, it is. أو No, it is not. و«,» وقفة قصيرة. ونطق no «نو»."),
      show(L, toks("Is it a cat? Yes, it is.")),
      readSentence(L, "It is not a bat. It is a cat.", W("cat"), [W("bat"), W("hat")]),
      readSentence(L, "Is it a bus? No, it is a van.", W("van"), [W("bus"), W("ship")]),
      readSentence(L, "Is it hot? Yes, it is.", M("hot-yes"), [M("hot-no")]),
      readSentence(L, "Is it a fish? No, it is a duck.", W("duck"), [W("fish"), W("crab")]),
      build(L, toks("Is it a fish?")),
      build(L, toks("It is not a cat.")),
      say(L, toks("Is it a cat?")),
    ]),
    lesson("z0-u2-l5", 5, "Colours and numbers", "الألوان والأرقام", ["أعرف الألوان بالسمع", "أفهم الأرقام من 11 إلى 20", "أقرأ جملة فيها لون أو رقم"], 20, (L) => {
      const colours: ItemId[] = [W("red"), W("green"), W("black"), W("pink"), W("blue"), W("yellow"), W("white")];
      const numbers = Array.from({ length: 10 }, (_, i) => `ch:num-${i + 11}` as ItemId);
      return [
        show(L, [W("blue")], "ألوان كتابتها لسا ما تعلمناها: اسمعها وشوف معناها."),
        show(L, [W("yellow")], "ألوان كتابتها لسا ما تعلمناها: اسمعها وشوف معناها."),
        show(L, [W("white")], "ألوان كتابتها لسا ما تعلمناها: اسمعها وشوف معناها."),
        ...colours.map((c, i) => listenPick(L, c, colours, i + 1)),
        ...numbers.map((n) => show(L, [n])),
        ...numbers.map((n, i) => listenPick(L, n, numbers, i + 3)),
        readSentence(L, "My bag is green.", W("green"), [W("red"), W("black")]),
        readSentence(L, "I have six cats.", M("six-cats"), [M("three-cats"), M("six-bats")]),
        build(L, toks("My cup is red.")),
        say(L, toks("I have ten pens.")),
      ];
    }),
    lesson("z0-u2-l6", 6, "the", "الـ", ["أقرأ the وأفهم معناها", "أقرأ جملة فيها مكان: on و in"], 20, (L) => [
      teach(L, ["sw:the"], "the معناها «الـ»: the cat = القطة. نطقها خفيف «ذَ» بصوت th الثاني (ذ)."),
      show(L, toks("The cat is on the bed.")),
      readSentence(L, "The cat is on the bed.", M("cat-on-bed"), [M("cat-in-box"), M("man-on-bed")]),
      readSentence(L, "The fish is in the sink.", M("fish-in-sink"), [M("fish-on-bed"), M("cat-in-sink")]),
      readSentence(L, "The pen is in the bag.", M("pen-in-bag"), [M("pen-on-bag"), M("cup-in-bag")]),
      build(L, toks("The cat is on the mat.")),
      build(L, toks("The bus is red.")),
      say(L, toks("The sun is hot.")),
    ]),
    lesson("z0-u2-l7", 7, "First texts", "أول نصوص", ["أقرأ نص من أربع جمل وأفهمه", "أجاوب أسئلة عن النص"], 25, (L) => {
      const a = "This is Nat. Nat has a cat. The cat is big. It is black.";
      const b = "I am Pat. I have a red bag. In the bag is a pen. I like my bag.";
      const c = "We are at home. Mum is in the shop. Dad has a cake. We like cake!";
      return [
        show(L, toks(a)),
        readSentence(L, a, M("nat-cat-big-black"), [M("nat-cat-small-white"), M("nat-dog-big-black")], "اقرأ النص بدون صوت: وش عند نات؟"),
        readSentence(L, b, W("red"), [W("blue"), W("green")], "اقرأ النص بدون صوت: وش لون شنطة بات؟"),
        readSentence(L, b, W("pen"), [W("cup"), W("fish")], "اقرأ النص مرة ثانية: وش فيه داخل الشنطة؟"),
        readSentence(L, c, W("cake"), [W("fish"), W("bag")], "اقرأ النص بدون صوت: وش عند بابا؟"),
        readSentence(L, c, M("mum-shop"), [M("mum-home"), M("mum-bus")], "اقرأ النص مرة ثانية: وين ماما؟"),
        build(L, toks("We like cake!")),
        say(L, toks("I am Pat.")),
      ];
    }),
    lesson("z0-u2-check", 9, "Stage 0 check", "اختبار المرحلة 0", ["أقرأ نصوص قصيرة وأفهمها", "أفهم كلمات وعبارات بالسمع", "أكوّن جمل بسيطة"], 20, (L) => {
      const t1 = "This is Sam. Sam has a big van. The van is green. Sam can drive the van.";
      const t2 = "It is hot. We are at the pool. Mum and Dad swim. I sit in the sun.";
      const t3 = "My name is Nat. I am six. I have a pet fish. It is pink.";
      const heard: ItemId[] = ["ch:hello", "ch:thank-you", "ch:bye", W("red"), W("blue"), W("green"), "ch:num-3", "ch:num-12", "ch:num-15", "ch:num-20", W("cat"), W("fish")];
      return [
        ...heard.map((h, i) => listenPick(L, h, heard.filter((x) => (imageOf(x) ?? "") !== "" || stage0ItemById.get(x)?.kind === "chunk"), i + 1)),
        readSentence(L, t1, W("green"), [W("red"), W("black")], "اقرأ النص بدون صوت: وش لون الفان؟"),
        readSentence(L, t1, M("sam-drive"), [M("sam-swim"), M("sam-sing")], "اقرأ النص مرة ثانية: وش يسوي سام؟"),
        readSentence(L, t2, M("weather-hot"), [M("weather-cold"), M("weather-wet")], "اقرأ النص بدون صوت: كيف الجو؟"),
        readSentence(L, t2, W("swim"), [W("sing"), W("run")], "اقرأ النص مرة ثانية: وش يسوون ماما وبابا؟"),
        readSentence(L, t3, "ch:num-6", ["ch:num-3", "ch:num-9"], "اقرأ النص بدون صوت: كم عمر نات؟"),
        readSentence(L, t3, W("fish"), [W("cat"), W("bat")], "اقرأ النص مرة ثانية: وش الحيوان الأليف عند نات؟"),
        build(L, toks("I have a big bag.")),
        build(L, toks("She is in the shop.")),
      ];
    }),
  ];
}
