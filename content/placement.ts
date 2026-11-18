import { gap, mcq, tf } from "./helpers";
import type { ListeningTask, Question, ReadingTask, SpeakingTask, WritingTask } from "./types";

export const placement: {
  grammar: Question[];
  reading: ReadingTask;
  listening: ListeningTask;
  writing: WritingTask;
  speaking: SpeakingTask;
} = {
  grammar: [
    mcq("g1", "If I ___ more time, I would learn another language.", ["have", "had", "will have", "would have"], 1, "Second conditional: If + past simple, would + verb."),
    mcq("g2", "She has lived in Riyadh ___ 2018.", ["for", "since", "from", "during"], 1, "'since' + a point in time."),
    mcq("g3", "The report ___ by the manager yesterday.", ["was written", "wrote", "has written", "is writing"], 0, "Past simple passive."),
    mcq("g4", "Choose the closest meaning: 'The results were *significant*.'", ["tiny", "important", "confusing", "late"], 1, "'significant' = important / large enough to matter."),
    mcq("g5", "___ the rain, the match continued.", ["Although", "Despite", "Because", "However"], 1, "'Despite' + noun."),
    mcq("g6", "Hardly ___ the house when it started to rain.", ["I had left", "had I left", "I left", "did I leave"], 1, "Negative inversion: Hardly had I…"),
    mcq("g7", "Choose the best word: 'The government plans to ___ the problem of housing.'", ["tackle", "make", "do", "take"], 0, "Collocation: tackle a problem."),
    mcq("g8", "The number of students ___ increased.", ["have", "has", "are", "were"], 1, "'The number' is singular."),
  ],
  reading: {
    title: "The Four-Minute Mile",
    timeMinutes: 6,
    paragraphs: [
      "For many years, athletes and doctors believed that running a mile in under four minutes was physically impossible. Some even claimed it would be dangerous to try. In 1954, a British medical student named Roger Bannister proved them wrong, finishing in 3 minutes 59.4 seconds.",
      "What happened next is often more surprising to people. Just 46 days later, an Australian runner, John Landy, broke Bannister's record. Within a few years, dozens of runners had achieved the same goal. Many psychologists use this story to argue that mental barriers can be as limiting as physical ones.",
      "Some sports historians, however, point out that training methods and running tracks were also improving at the time, so the change was not purely psychological.",
    ],
    questions: [
      tf("pr1", "Bannister was a professional athlete with no other job.", "FALSE", "He was a medical student."),
      gap("pr2", "Landy broke Bannister's record ___ days later.", ["46", "forty-six"], "'Just 46 days later'."),
      tf("pr3", "All experts agree that the change was only psychological.", "FALSE", "Historians mention training and tracks too."),
      mcq("pr4", "What do psychologists use the story to show?", ["Running is dangerous.", "Mental barriers can limit performance.", "Doctors are often wrong.", "Australians are faster runners."], 1, "Paragraph 2."),
    ],
  },
  listening: {
    context: "A student is asking about an English conversation club.",
    script: [
      { speaker: "Student", voice: "female", text: "Hi, I saw a poster about the English conversation club. When does it meet?" },
      { speaker: "Organiser", voice: "male", text: "Every Thursday evening at seven, in room B twelve of the Language Centre. We used to meet on Mondays, but Thursdays are more popular." },
      { speaker: "Student", voice: "female", text: "Is it free?" },
      { speaker: "Organiser", voice: "male", text: "It's free for students. Other members pay three pounds a session. Each week we choose a different topic — this week it's travel, and next week it's food." },
    ],
    questions: [
      gap("pl1", "Day: ___", ["Thursday", "Thursdays"], "Monday was the old day."),
      gap("pl2", "Room: B ___", ["12", "twelve"], "'room B twelve'."),
      gap("pl3", "Price for non-students: £___", ["3", "three"], "'three pounds a session'."),
      gap("pl4", "Next week's topic: ___", ["food"], "This week is travel; next week is food."),
    ],
  },
  writing: {
    task: "task2",
    prompt:
      "Some people prefer to study alone, while others prefer to study in a group. Which do you prefer, and why? Write about 120–180 words.",
    minWords: 100,
    timeMinutes: 15,
    tips: ["Give your opinion and two reasons with examples."],
  },
  speaking: {
    part: 1,
    questions: ["Why do you want to improve your English, and what is the most difficult part of learning it for you?"],
    prepSeconds: 0,
    speakSeconds: 60,
  },
};
