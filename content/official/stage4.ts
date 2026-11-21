import type { QuestionGroup } from "@/lib/mock/schema";
import { G, letters, ONE_WORD, ONE_WORD_OR_NUMBER, romans } from "./helpers";

/** Official IELTS question groups for Stage 4 lessons and checkpoint, keyed by lesson / checkpoint task id. */
export const stage4Groups: Record<string, QuestionGroup[]> = {
  // ---------- Unit 1 · Reading: Why We Sleep (timed passage) ----------
  "s4-u1-reading": [
    G({
      id: "s4u1r-info",
      type: "matching",
      instructions: "Questions 1–3. The passage has six paragraphs, A–F. Which paragraph contains the following information? Write the correct letter, A–F. NB You may use any letter more than once.",
      allowReuse: true,
      options: letters("Paragraph A", "Paragraph B", "Paragraph C", "Paragraph D", "Paragraph E", "Paragraph F"),
      questions: [
        { n: 1, prompt: "a description of how sleep may remove harmful substances from the brain", answer: ["C"], explanation: "Fluid washes away waste proteins (paragraph C)." },
        { n: 2, prompt: "a natural change in the body clock that happens during adolescence", answer: ["E"], explanation: "'their circadian rhythms naturally shift later during adolescence'." },
        { n: 3, prompt: "a comparison between lack of sleep and the effects of alcohol", answer: ["D"], explanation: "Reaction times 'comparable to those of a person over the legal alcohol limit'." },
      ],
    }),
    G({
      id: "s4u1r-notes",
      type: "completion",
      title: "Sleep: key facts",
      instructions: "Questions 4–7. Complete the notes below. Choose ONE WORD AND/OR A NUMBER from the passage for each answer.",
      wordLimit: ONE_WORD_OR_NUMBER,
      questions: [
        { n: 4, prompt: "During deep sleep, information moves from the hippocampus to the ___", answer: ["cortex"], explanation: "'to long-term storage in the cortex'." },
        { n: 5, prompt: "In mice, the space between brain cells grows by about ___ % during sleep", answer: ["60", "sixty"], explanation: "'increases by around 60%'." },
        { n: 6, prompt: "Blue light from screens delays the release of ___", answer: ["melatonin"], explanation: "'delays the release of melatonin'." },
        { n: 7, prompt: "Recommended for adults: seven to ___ hours a night", answer: ["nine", "9"], explanation: "'seven to nine hours a night'." },
      ],
    }),
    G({
      id: "s4u1r-tfng",
      type: "tfng",
      instructions: "Questions 8–10. Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.",
      questions: [
        { n: 8, prompt: "Scientists have proven that poor sleep causes Alzheimer's disease.", answer: ["FALSE"], explanation: "'remains unproven'." },
        { n: 9, prompt: "Lack of sleep can affect the hormones that control appetite.", answer: ["TRUE"], explanation: "'disrupts the hormones that regulate appetite and stress'." },
        { n: 10, prompt: "Later school start times improved exam results in every American school district.", answer: ["NOT GIVEN"], explanation: "Only attendance and attention are mentioned, in 'several' districts." },
      ],
    }),
  ],

  // ---------- Unit 1 · Listening: The History of Map-Making (Part 4) ----------
  "s4-u1-listening": [
    G({
      id: "s4u1l-notes",
      type: "completion",
      title: "The history of map-making",
      instructions: "Questions 1–4. Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.",
      wordLimit: ONE_WORD_OR_NUMBER,
      questions: [
        { n: 1, prompt: "One of the oldest world maps: a Babylonian tablet made of ___", answer: ["clay"], explanation: "'a Babylonian clay tablet'." },
        { n: 2, prompt: "Ptolemy introduced a ___ system of latitude and longitude", answer: ["grid"], explanation: "'a grid system of latitude and longitude'." },
        { n: 3, prompt: "The Mercator projection (1569) was designed for ___", answer: ["sailors"], explanation: "'It was designed for sailors'." },
        { n: 4, prompt: "In reality, Africa is about ___ times larger than Greenland", answer: ["14", "fourteen"], explanation: "'about fourteen times larger'." },
      ],
    }),
    G({
      id: "s4u1l-mcq",
      type: "mcq",
      instructions: "Questions 5–6. Choose the correct letter, A, B or C.",
      questions: [
        { n: 5, prompt: "What was at the centre of the Babylonian map?", options: letters("Babylon", "the sea", "the sun"), answer: ["A"], explanation: "'with Babylon at the centre'." },
        { n: 6, prompt: "What concern does the lecturer raise about digital maps?", options: letters("They are less accurate than paper maps.", "A single company can have great influence.", "Satellite data is too expensive."), answer: ["B"], explanation: "'decisions about which places are shown… carry enormous influence'." },
      ],
    }),
  ],

  // ---------- Unit 2 · Reading: Machines at the Bedside (distractors) ----------
  "s4-u2-reading": [
    G({
      id: "s4u2r-mcq",
      type: "mcq",
      instructions: "Questions 1–3. Choose the correct letter, A, B, C or D.",
      questions: [
        { n: 1, prompt: "What did the 2017 Stanford study find?", options: letters("AI was more accurate than all doctors.", "AI identified skin cancer about as well as dermatologists.", "AI could replace dermatologists.", "Dermatologists preferred AI tools."), answer: ["B"], explanation: "'about as accurately as' = matched. A over-generalises; C is not stated." },
        { n: 2, prompt: "Why does the writer mention the AI tool used in India?", options: letters("to show that AI is cheaper than doctors", "to show how AI can help where specialists are scarce", "to criticise hospitals in India", "to prove that AI never makes mistakes"), answer: ["B"], explanation: "'where an eye specialist might otherwise be weeks away'." },
        { n: 3, prompt: "In the Swedish breast cancer trial, AI combined with one radiologist", options: letters("found fewer cancers but saved time.", "found more cancers and reduced the workload.", "replaced radiologists completely.", "doubled the radiologists' workload."), answer: ["B"], explanation: "'detected more cancers than two radiologists… while reducing workload by almost half'." },
      ],
    }),
    G({
      id: "s4u2r-two",
      type: "mcq-multi",
      instructions: "Questions 4–5. Choose TWO letters, A–E.",
      prompt: "Which TWO problems with medical AI does the writer mention?",
      options: letters(
        "Performance may fall when systems are used in real hospitals.",
        "The systems are too expensive for most hospitals.",
        "Some systems are less accurate for certain groups of patients.",
        "Most doctors refuse to use them.",
        "They cannot analyse X-rays.",
      ),
      questions: [
        { n: 4, answer: ["A", "C"], explanation: "Performance drops in real hospitals; less accurate for darker skin. Cost (B) and refusal (D) are not mentioned; X-rays (E) are analysed successfully." },
        { n: 5, answer: ["A", "C"] },
      ],
    }),
    G({
      id: "s4u2r-ynng",
      type: "ynng",
      instructions: "Questions 6–8. Do the following statements agree with the claims of the writer? Write YES, NO or NOT GIVEN.",
      questions: [
        { n: 6, prompt: "News headlines give a simplified picture of medical AI.", answer: ["YES"], explanation: "'the evidence is more complicated than the headlines suggest'." },
        { n: 7, prompt: "Current regulations clearly state who is responsible when AI makes a mistake.", answer: ["NO"], explanation: "'Current regulations in most countries were not designed with such cases in mind.'" },
        { n: 8, prompt: "Medical AI will eventually replace radiologists completely.", answer: ["NO"], explanation: "'The future… belongs not to machines alone, but to… partnerships between humans and machines.'" },
      ],
    }),
  ],

  // ---------- Unit 2 · Listening: Booking a Cottage (Parts 1–2 traps) ----------
  "s4-u2-listening": [
    G({
      id: "s4u2l-form",
      type: "completion",
      title: "Seaview Cottages — Booking form",
      instructions: "Questions 1–7. Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.",
      wordLimit: ONE_WORD_OR_NUMBER,
      questions: [
        { n: 1, prompt: "Arrival: ___ July", answer: ["22", "22nd", "twenty-second"], explanation: "The 15th is corrected to the 22nd." },
        { n: 2, prompt: "Cottage: ___ Cottage", answer: ["Willow"], explanation: "Harbour Cottage is rejected because it has no garden." },
        { n: 3, prompt: "Price for the week: £___", answer: ["640"], explanation: "'six hundred and forty pounds'." },
        { n: 4, prompt: "Deposit: £___", answer: ["150"], explanation: "'one hundred and fifty pounds'." },
        { n: 5, prompt: "Deposit refunded if cancelled at least ___ days before arrival", answer: ["30", "thirty"], explanation: "'at least thirty days before arrival'." },
        { n: 6, prompt: "Check-in from ___ pm", answer: ["4", "four"], explanation: "'from four o'clock, not three'." },
        { n: 7, prompt: "Surname: Chris ___", answer: ["Fairbourne"], explanation: "Spelled F-A-I-R-B-O-U-R-N-E." },
      ],
    }),
  ],

  // ---------- Unit 3 · Reading: Letting Cities Go Wild ----------
  "s4-u3-reading": [
    G({
      id: "s4u3r-tfng",
      type: "tfng",
      instructions: "Questions 1–3. Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.",
      questions: [
        { n: 1, prompt: "Conventional lawns support a wide variety of insect species.", answer: ["FALSE"], explanation: "They support 'only a fraction' of the species in a meadow." },
        { n: 2, prompt: "Rewilding can reduce the cost of maintaining green spaces.", answer: ["TRUE"], explanation: "'lower fuel and labour expenses'." },
        { n: 3, prompt: "Rewilding projects have been introduced in every large British city.", answer: ["NOT GIVEN"], explanation: "Only Brighton is mentioned." },
      ],
    }),
    G({
      id: "s4u3r-summary",
      type: "completion-box",
      title: "How urban rewilding works",
      instructions: "Questions 4–7. Complete the summary using the list of words, A–H, below.",
      options: letters("control", "decay", "untidy", "edges", "water", "expensive", "colourful", "flowers"),
      questions: [
        { n: 4, prompt: "Rewilding means that managers impose less strict ___ on green spaces.", answer: ["A"], explanation: "'Rather than imposing strict control'." },
        { n: 5, prompt: "Dead wood is left to ___, which provides habitats for fungi and beetles.", answer: ["B"], explanation: "'dead wood is left to decay'." },
        { n: 6, prompt: "Some residents complain that rewilded areas look ___.", answer: ["C"], explanation: "'look untidy or neglected'." },
        { n: 7, prompt: "Signs and neatly mown ___ can make wilder areas look intentional.", answer: ["D"], explanation: "'together with neatly mown edges'." },
      ],
    }),
    G({
      id: "s4u3r-people",
      type: "matching",
      title: "List of people",
      instructions: "Questions 8–11. Match each statement with the correct group of people, A–D.",
      options: letters("some residents", "councillors in Brighton", "experts", "advocates of rewilding"),
      questions: [
        { n: 8, prompt: "recorded an increase in wildflowers and pollinators", answer: ["B"], explanation: "'councillors recorded a significant increase in wildflowers and pollinators'." },
        { n: 9, prompt: "worried about ticks and allergies", answer: ["A"], explanation: "'Some residents complain… there are concerns about ticks and allergies.'" },
        { n: 10, prompt: "suggested signs explaining the purpose of the change", answer: ["C"], explanation: "'Experts suggest that clear signs…'" },
        { n: 11, prompt: "linked biodiverse green spaces with lower stress", answer: ["D"], explanation: "'Advocates stress… people who spend time in biodiverse green spaces report lower stress levels'." },
      ],
    }),
  ],

  // ---------- Unit 3 · Listening: Research Methods (Part 3) ----------
  "s4-u3-listening": [
    G({
      id: "s4u3l-methods",
      type: "mcq-multi",
      instructions: "Questions 1–2. Choose TWO letters, A–E.",
      prompt: "Which TWO research methods will Hana and Sam use?",
      options: letters("a questionnaire", "interviews", "observation", "a focus group", "an experiment"),
      questions: [
        { n: 1, answer: ["A", "B"], explanation: "A large questionnaire plus ten interviews." },
        { n: 2, answer: ["A", "B"] },
      ],
    }),
    G({
      id: "s4u3l-who",
      type: "matching",
      instructions: "Questions 3–6. Who suggests each idea? Write the correct letter, A or B. NB You may use any letter more than once.",
      allowReuse: true,
      options: letters("Hana", "Sam"),
      questions: [
        { n: 3, prompt: "collecting five hundred questionnaire responses", answer: ["A"], explanation: "Hana: 'We could get five hundred responses.'" },
        { n: 4, prompt: "including interviews to find out students' reasons", answer: ["B"], explanation: "Sam: 'I'd like to include some interviews too.'" },
        { n: 5, prompt: "limiting the number of interviews", answer: ["A"], explanation: "Hana: 'Maybe ten interviews, not thirty?'" },
        { n: 6, prompt: "working on the ethics application today", answer: ["B"], explanation: "Sam: 'Let's focus on that today, rather than the literature review.'" },
      ],
    }),
    G({
      id: "s4u3l-notes",
      type: "completion",
      instructions: "Questions 7–8. Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.",
      wordLimit: ONE_WORD_OR_NUMBER,
      questions: [
        { n: 7, prompt: "Interviews: ___ students from a mix of subjects", answer: ["10", "ten"], explanation: "Ten interviews, agreed by both." },
        { n: 8, prompt: "Next ethics committee meeting: the ___ of the month", answer: ["9th", "ninth", "9"], explanation: "'The next meeting is on the ninth.'" },
      ],
    }),
  ],

  // ---------- Checkpoint (Summit Mock Test) ----------
  "s4-checkpoint-reading": [
    G({
      id: "s4cr-headings",
      type: "matching",
      title: "List of headings",
      instructions: "Questions 1–4. The passage has five paragraphs, A–E. Choose the correct heading for paragraphs B–E from the list of headings below. Write the correct number, i–vi.",
      options: romans("The history of advertising", "How design keeps users engaged", "Wider effects on society and health", "A counter-argument", "A regulatory response", "Why users pay for apps"),
      questions: [
        { n: 1, prompt: "Paragraph B", answer: ["ii"], explanation: "Infinite scrolling, autoplay and unpredictable rewards." },
        { n: 2, prompt: "Paragraph C", answer: ["iii"], explanation: "Outrage, misinformation and teenage anxiety." },
        { n: 3, prompt: "Paragraph D", answer: ["iv"], explanation: "'Defenders of the industry point out…'" },
        { n: 4, prompt: "Paragraph E", answer: ["v"], explanation: "The EU's Digital Services Act." },
      ],
    }),
    G({
      id: "s4cr-tfng",
      type: "tfng",
      instructions: "Questions 5–7. Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.",
      questions: [
        { n: 5, prompt: "Researchers fully agree about the effect of social media on teenage anxiety.", answer: ["FALSE"], explanation: "'the size and direction of this effect remain debated'." },
        { n: 6, prompt: "The Digital Services Act bans all personalised recommendation feeds.", answer: ["FALSE"], explanation: "It requires at least one feed not based on profiling." },
        { n: 7, prompt: "Herbert Simon worked for a technology company.", answer: ["NOT GIVEN"], explanation: "He is described only as an economist." },
      ],
    }),
    G({
      id: "s4cr-mcq",
      type: "mcq",
      instructions: "Question 8. Choose the correct letter, A, B, C or D.",
      questions: [
        { n: 8, prompt: "What is the writer's attitude to the new regulations in Paragraph E?", options: letters("confident that they will solve the problem", "uncertain whether they can change the underlying incentives", "strongly opposed to them", "uninterested in them"), answer: ["B"], explanation: "'remains an open question'." },
      ],
    }),
  ],
  "s4-checkpoint-listening": [
    G({
      id: "s4cl-notes",
      type: "completion",
      title: "The psychology of habits",
      instructions: "Questions 1–4. Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.",
      wordLimit: ONE_WORD_OR_NUMBER,
      questions: [
        { n: 1, prompt: "About ___ % of daily actions are habits", answer: ["40", "forty"], explanation: "'Around forty percent'." },
        { n: 2, prompt: "The habit loop: a cue, a routine and a ___", answer: ["reward"], explanation: "'a cue, a routine, and a reward'." },
        { n: 3, prompt: "UCL study: a new habit took ___ days on average", answer: ["66", "sixty-six"], explanation: "Not 21 days — that's the popular belief." },
        { n: 4, prompt: "Attaching a new habit to an existing one is called habit ___", answer: ["stacking"], explanation: "'habit stacking'." },
      ],
    }),
    G({
      id: "s4cl-mcq",
      type: "mcq",
      instructions: "Question 5. Choose the correct letter, A, B or C.",
      questions: [
        { n: 5, prompt: "What did the study find about missing a single day?", options: letters("It reset progress to zero.", "It made almost no difference.", "It doubled the time needed."), answer: ["B"], explanation: "'missing a single day made almost no difference'." },
      ],
    }),
  ],
};
