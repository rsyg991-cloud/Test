import type { QuestionGroup } from "@/lib/mock/schema";
import { G, letters, ONE_WORD, ONE_WORD_OR_NUMBER } from "./helpers";

/** Official IELTS question groups for Stage 3 lessons and checkpoint, keyed by lesson / checkpoint task id. */
export const stage3Groups: Record<string, QuestionGroup[]> = {
  // ---------- Unit 1 · Reading: The Placebo Paradox (inference) ----------
  "s3-u1-reading": [
    G({
      id: "s3u1r-mcq",
      type: "mcq",
      instructions: "Questions 1–3. Choose the correct letter, A, B, C or D.",
      questions: [
        { n: 1, prompt: "How has the scientific view of the placebo effect changed?", options: letters("It is now considered dangerous.", "It was once seen as a nuisance but is now worth studying.", "It has been shown not to exist.", "It is now included in all medicines."), answer: ["B"], explanation: "'Traditionally… regarded as a nuisance… Increasingly, however, researchers see it as a phenomenon worth studying in its own right.'" },
        { n: 2, prompt: "What does the writer suggest by calling some factors 'surprisingly superficial'?", options: letters("They have no real effect on patients.", "Features unrelated to the medicine itself can change results.", "Doctors should stop giving injections.", "Packaging is the most important factor in treatment."), answer: ["B"], explanation: "Number of pills, injections and packaging have nothing to do with the medicine, yet they change outcomes." },
        { n: 3, prompt: "What is the writer's main conclusion?", options: letters("Placebos should replace conventional medicine.", "The way doctors communicate can contribute to healing.", "Pharmacies should sell placebo pills.", "The placebo effect is unethical and should be avoided."), answer: ["B"], explanation: "'A doctor who listens carefully… may… be adding a powerful \"ingredient\"'." },
      ],
    }),
    G({
      id: "s3u1r-tfng",
      type: "tfng",
      instructions: "Questions 4–6. Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.",
      questions: [
        { n: 4, prompt: "Patients in the 2010 Harvard study knew they were taking sugar pills.", answer: ["TRUE"], explanation: "'were told plainly that they were receiving sugar pills'." },
        { n: 5, prompt: "Expensive-looking packaging produced weaker results than plain boxes.", answer: ["FALSE"], explanation: "'expensive-looking packaging produces stronger results than plain boxes'." },
        { n: 6, prompt: "The Harvard study lasted for six months.", answer: ["NOT GIVEN"], explanation: "The length of the study is never mentioned." },
      ],
    }),
    G({
      id: "s3u1r-endings",
      type: "matching",
      title: "List of endings",
      instructions: "Questions 7–9. Complete each sentence with the correct ending, A–E, below.",
      options: letters(
        "can cause the brain to release natural painkillers.",
        "may undermine patients' trust in medicine.",
        "are usually measured through patients' own reports.",
        "are more effective when given by doctors in hospitals.",
        "have been removed from clinical trials.",
      ),
      questions: [
        { n: 7, prompt: "Brain-imaging studies show that expecting pain relief", answer: ["A"], explanation: "'their brains release natural painkillers called endorphins'." },
        { n: 8, prompt: "Deceiving patients about their treatment", answer: ["B"], explanation: "'Deceiving patients undermines trust, which is fundamental to medicine.'" },
        { n: 9, prompt: "The conditions that respond best to placebos", answer: ["C"], explanation: "'those measured through patients' own reports'." },
      ],
    }),
  ],

  // ---------- Unit 1 · Listening: Urban Heat Islands (Part 4 lecture) ----------
  "s3-u1-listening": [
    G({
      id: "s3u1l-notes",
      type: "completion",
      title: "Urban heat islands",
      instructions: "Questions 1–5. Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.",
      wordLimit: ONE_WORD_OR_NUMBER,
      questions: [
        { n: 1, section: "The problem", prompt: "At night, cities can be up to ___ °C warmer than the countryside", answer: ["12", "twelve"], explanation: "'as much as twelve degrees Celsius'." },
        { n: 2, section: "Causes", prompt: "Main cause: the ___ used for building, e.g. asphalt and concrete", answer: ["materials"], explanation: "'The main factor is the materials we build with.'" },
        { n: 3, prompt: "Plants cool the air through ___", answer: ["evapotranspiration"], explanation: "A technical term the lecturer explains: plants 'sweat'." },
        { n: 4, prompt: "Waste heat from air conditioners and ___", answer: ["vehicles"], explanation: "'waste heat from air conditioners and vehicles'." },
        { n: 5, section: "Solutions", prompt: "A tree-lined street can be up to ___ degrees cooler", answer: ["5", "five"], explanation: "Five degrees for trees; six is the reflective roads (a distractor)." },
      ],
    }),
    G({
      id: "s3u1l-mcq",
      type: "mcq",
      instructions: "Questions 6–7. Choose the correct letter, A, B or C.",
      questions: [
        { n: 6, prompt: "Which group does the lecturer say is most at risk during heatwaves?", options: letters("children", "elderly people", "outdoor workers"), answer: ["B"], explanation: "'particularly among elderly people'." },
        { n: 7, prompt: "What does the lecturer say about the reflective coating in Los Angeles?", options: letters("It lowered surface temperatures by about six degrees.", "It was too expensive to continue.", "It was used only on roofs."), answer: ["A"], explanation: "'lowered surface temperatures by around six degrees'." },
      ],
    }),
  ],

  // ---------- Unit 2 · Reading: The Four-Day Week (writer's views) ----------
  "s3-u2-reading": [
    G({
      id: "s3u2r-ynng",
      type: "ynng",
      instructions: "Questions 1–5. Do the following statements agree with the claims of the writer? Write YES if the statement agrees with the claims of the writer, NO if the statement contradicts the claims of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.",
      questions: [
        { n: 1, prompt: "The headline results of the trial were impressive.", answer: ["YES"], explanation: "'The headline results were undeniably impressive.'" },
        { n: 2, prompt: "The trial proves that the five-day week is outdated.", answer: ["NO"], explanation: "That is the supporters' claim; the writer says 'it would be naive to assume…'." },
        { n: 3, prompt: "The companies in the trial may not represent the wider economy.", answer: ["YES"], explanation: "They volunteered, were enthusiastic and were mostly small firms in particular sectors." },
        { n: 4, prompt: "Hospitals could adopt a four-day week without extra cost.", answer: ["NO"], explanation: "'a shorter week… would almost certainly mean higher costs'." },
        { n: 5, prompt: "The British government will soon make the four-day week law.", answer: ["NOT GIVEN"], explanation: "The writer says nothing about legislation." },
      ],
    }),
    G({
      id: "s3u2r-sentences",
      type: "completion",
      instructions: "Questions 6–7. Complete the sentences below. Choose ONE WORD ONLY from the passage for each answer.",
      wordLimit: ONE_WORD,
      questions: [
        { n: 6, prompt: "Most companies in the trial were small firms in sectors such as marketing and ___.", answer: ["software"], explanation: "'small firms in sectors such as marketing and software'." },
        { n: 7, prompt: "The trial showed that many organisations waste time on unnecessary meetings and ___.", answer: ["processes"], explanation: "'unnecessary meetings and processes'." },
      ],
    }),
    G({
      id: "s3u2r-mcq",
      type: "mcq",
      instructions: "Question 8. Choose the correct letter, A, B, C or D.",
      questions: [
        { n: 8, prompt: "What is the writer's final point?", options: letters("Meetings should be banned at work.", "The four-day week should be rejected.", "How time is used may matter more than the number of days.", "Small firms are always more productive."), answer: ["C"], explanation: "'The real lesson may not be about the number of days at all, but about how intelligently working time is used.'" },
      ],
    }),
  ],

  // ---------- Unit 2 · Listening: Nudges (Part 4 lecture) ----------
  "s3-u2-listening": [
    G({
      id: "s3u2l-mcq",
      type: "mcq",
      instructions: "Questions 1–2. Choose the correct letter, A, B or C.",
      questions: [
        { n: 1, prompt: "According to behavioural economics, people tend to", options: letters("choose the cheapest option.", "choose the option that needs the least effort.", "make fully rational decisions."), answer: ["B"], explanation: "'we strongly prefer whatever option requires the least effort'." },
        { n: 2, prompt: "A nudge works by", options: letters("offering a financial reward.", "banning certain choices.", "changing how a choice is presented."), answer: ["C"], explanation: "'a small change in how a choice is presented'." },
      ],
    }),
    G({
      id: "s3u2l-notes",
      type: "completion",
      title: "Examples of nudges",
      instructions: "Questions 3–6. Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.",
      wordLimit: ONE_WORD_OR_NUMBER,
      questions: [
        { n: 3, section: "Pensions", prompt: "When employees had to sign up themselves: about ___ % joined", answer: ["40", "forty"], explanation: "'only about forty percent did'." },
        { n: 4, prompt: "When joining was the default option: about ___ % joined", answer: ["90", "ninety"], explanation: "'participation jumped to around ninety percent'." },
        { n: 5, section: "Tax letters", prompt: "Letters to late payers used social ___", answer: ["comparison"], explanation: "'Another example is social comparison.'" },
        { n: 6, section: "Criticism", prompt: "Researchers say nudges should be transparent and easy to ___", answer: ["avoid"], explanation: "'nudges should be transparent and easy to avoid'." },
      ],
    }),
  ],

  // ---------- Unit 3 · Reading: When Languages Die (speed & accuracy) ----------
  "s3-u3-reading": [
    G({
      id: "s3u3r-info",
      type: "matching",
      instructions: "Questions 1–4. The passage has five paragraphs, A–E. Which paragraph contains the following information? Write the correct letter, A–E. NB You may use any letter more than once.",
      allowReuse: true,
      options: letters("Paragraph A", "Paragraph B", "Paragraph C", "Paragraph D", "Paragraph E"),
      questions: [
        { n: 1, prompt: "an example of a language that was successfully revived", answer: ["D"], explanation: "Hebrew and Welsh in paragraph D." },
        { n: 2, prompt: "a reason why parents may stop speaking a minority language to their children", answer: ["B"], explanation: "'believing it offers better economic opportunities'." },
        { n: 3, prompt: "an estimate of how quickly languages are disappearing", answer: ["A"], explanation: "'a language disappears approximately every few months'." },
        { n: 4, prompt: "a warning about the limits of technology", answer: ["E"], explanation: "'technology cannot replace the most crucial factor'." },
      ],
    }),
    G({
      id: "s3u3r-summary",
      type: "completion",
      title: "Why language loss matters",
      instructions: "Questions 5–7. Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.",
      wordLimit: ONE_WORD,
      questions: [
        { n: 5, prompt: "Each language encodes a particular way of seeing the ___.", answer: ["world"], explanation: "'a particular way of seeing the world'." },
        { n: 6, prompt: "Some Aboriginal Australian languages use ___ directions instead of 'left' and 'right'.", answer: ["compass"], explanation: "'use compass directions rather than \"left\" and \"right\"'." },
        { n: 7, prompt: "Indigenous languages also hold knowledge of local plants and ___.", answer: ["ecosystems"], explanation: "'knowledge of local plants and ecosystems'." },
      ],
    }),
    G({
      id: "s3u3r-tfng",
      type: "tfng",
      instructions: "Questions 8–10. Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.",
      questions: [
        { n: 8, prompt: "Hebrew was not used at all in the centuries before its revival.", answer: ["FALSE"], explanation: "It was 'used for centuries mainly in religious contexts'." },
        { n: 9, prompt: "The number of young Welsh speakers has risen.", answer: ["TRUE"], explanation: "'the number of young speakers has risen'." },
        { n: 10, prompt: "Welsh-medium schools receive more funding than English-medium schools.", answer: ["NOT GIVEN"], explanation: "Funding is not mentioned." },
      ],
    }),
  ],

  // ---------- Unit 3 · Listening: Seminar on Museums (Part 3) ----------
  "s3-u3-listening": [
    G({
      id: "s3u3l-who",
      type: "matching",
      instructions: "Questions 1–4. Who expresses each opinion? Write the correct letter, A, B or C. NB You may use any letter more than once.",
      allowReuse: true,
      options: letters("Rina", "Noah", "both Rina and Noah"),
      questions: [
        { n: 1, prompt: "Images online cannot replace seeing a real object.", answer: ["A"], explanation: "Rina: 'Online images can't replace seeing a real artefact.'" },
        { n: 2, prompt: "Virtual tours allow people to study objects in more detail.", answer: ["B"], explanation: "Noah: 'Virtual tours let people study things in much more detail'." },
        { n: 3, prompt: "Many museums are already free to visit.", answer: ["A"], explanation: "Rina: 'many museums are free too, at least in the UK'." },
        { n: 4, prompt: "Objects taken in colonial times should be returned.", answer: ["C"], explanation: "Noah says they should be returned; Rina: 'I agree with Noah on that'." },
      ],
    }),
    G({
      id: "s3u3l-tutor",
      type: "mcq-multi",
      instructions: "Questions 5–6. Choose TWO letters, A–E.",
      prompt: "Which TWO things does the tutor say at the end of the seminar?",
      options: letters(
        "Physical visits to museums are overrated.",
        "The students disagree about the value of physical visits.",
        "The students agree about returning objects.",
        "Museums should charge an entry fee.",
        "The students must write an essay for next week.",
      ),
      questions: [
        { n: 5, answer: ["B", "C"], explanation: "'you disagree on the value of physical visits, but agree on repatriation'. The homework is reading an article, not an essay." },
        { n: 6, answer: ["B", "C"] },
      ],
    }),
  ],

  // ---------- Checkpoint ----------
  "s3-checkpoint-reading": [
    G({
      id: "s3cr-mcq1",
      type: "mcq",
      instructions: "Question 1. Choose the correct letter, A, B, C or D.",
      questions: [
        { n: 1, prompt: "What does the writer suggest about the popular view of multitasking?", options: letters("It is supported by neuroscience.", "It is not supported by research.", "It only applies to managers.", "It is a new idea."), answer: ["B"], explanation: "'Neuroscience, however, paints a less flattering picture.'" },
      ],
    }),
    G({
      id: "s3cr-sentence",
      type: "completion",
      instructions: "Question 2. Complete the sentence below. Write ONE WORD AND/OR A NUMBER.",
      wordLimit: ONE_WORD_OR_NUMBER,
      questions: [{ n: 2, prompt: "Switching between tasks can reduce productivity by as much as ___ %.", answer: ["40", "forty"], explanation: "University of Michigan study." }],
    }),
    G({
      id: "s3cr-tfng",
      type: "tfng",
      instructions: "Questions 3–5. Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.",
      questions: [
        { n: 3, prompt: "The Stanford researchers expected heavy multitaskers to perform worse.", answer: ["FALSE"], explanation: "The results were 'contrary to the researchers' initial expectations'." },
        { n: 4, prompt: "Walking while talking usually causes serious problems.", answer: ["FALSE"], explanation: "'causes few problems'." },
        { n: 5, prompt: "Focus hours have been shown to double productivity.", answer: ["NOT GIVEN"], explanation: "No results for focus hours are given." },
      ],
    }),
    G({
      id: "s3cr-mcq2",
      type: "mcq",
      instructions: "Question 6. Choose the correct letter, A, B, C or D.",
      questions: [
        { n: 6, prompt: "What is the main idea of the final paragraph?", options: letters("Open-plan offices are cheaper.", "Workplace design may encourage harmful multitasking.", "Notifications should be banned by law.", "Meetings are always unproductive."), answer: ["B"], explanation: "Offices and notifications 'may encourage the very behaviour that reduces performance'." },
      ],
    }),
  ],
  "s3-checkpoint-listening": [
    G({
      id: "s3cl-notes",
      type: "completion",
      title: "The history of coffee",
      instructions: "Questions 1–3. Complete the notes below. Write ONE WORD ONLY for each answer.",
      wordLimit: ONE_WORD,
      questions: [
        { n: 1, prompt: "Legend: discovered by a goat ___ in Ethiopia", answer: ["herder"], explanation: "'a goat herder'." },
        { n: 2, prompt: "By the 15th century, cultivated in ___", answer: ["Yemen"], explanation: "'cultivated in Yemen'." },
        { n: 3, prompt: "English coffee houses were nicknamed 'penny ___'", answer: ["universities"], explanation: "'penny universities'." },
      ],
    }),
    G({
      id: "s3cl-mcq",
      type: "mcq",
      instructions: "Questions 4–5. Choose the correct letter, A, B or C.",
      questions: [
        { n: 4, prompt: "Which country is the world's largest coffee producer today?", options: letters("Ethiopia", "Yemen", "Brazil"), answer: ["C"], explanation: "'a position it still holds today'." },
        { n: 5, prompt: "What does the lecturer say is often left out of popular histories?", options: letters("the role of goats", "the use of slave labour", "the price of coffee"), answer: ["B"], explanation: "'a dark chapter that is often left out'." },
      ],
    }),
  ],
};
