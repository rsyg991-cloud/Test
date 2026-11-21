import type { PracticePrompt, SpeakingTask, WritingTask } from "./types";

const w2 = (prompt: string, tips: string[] = []): WritingTask => ({
  task: "task2",
  prompt: `${prompt} Write at least 250 words.`,
  minWords: 250,
  timeMinutes: 40,
  tips,
});

const sp = (part: 1 | 2 | 3, questions: string[], cue?: SpeakingTask["cueCard"]): SpeakingTask => ({
  part,
  questions,
  cueCard: cue,
  prepSeconds: part === 2 ? 60 : 0,
  speakSeconds: part === 1 ? 40 : part === 2 ? 120 : 90,
});

/** Extra AI-graded drills used to fill daily sessions on longer plans. */
export const practicePrompts: PracticePrompt[] = [
  // Stage 4
  { id: "p1-w1", stage: 4, skill: "writing", title: "Shopping online", writing: w2("More and more people are shopping online rather than in stores. Is this a positive or negative development?", ["Give a clear opinion.", "One idea per body paragraph."]) },
  { id: "p1-w2", stage: 4, skill: "writing", title: "Children and pets", writing: w2("Some people believe every child should have a pet. To what extent do you agree or disagree?") },
  { id: "p1-w3", stage: 4, skill: "writing", title: "Learning to cook", writing: w2("Cooking should be taught as a compulsory subject at school. To what extent do you agree or disagree?") },
  { id: "p1-s1", stage: 4, skill: "speaking", title: "Weather & seasons", speaking: sp(1, ["What's the weather like where you live?", "Which season do you like best? Why?", "Does the weather affect your mood?"]) },
  { id: "p1-s2", stage: 4, skill: "speaking", title: "A gift you gave", speaking: sp(2, ["Describe a gift you gave to someone."], { topic: "Describe a gift you gave to someone.", bullets: ["what it was", "who you gave it to", "why you chose it", "and explain how the person felt"] }) },
  { id: "p1-s3", stage: 4, skill: "speaking", title: "Music", speaking: sp(1, ["What kind of music do you like?", "Did you learn to play an instrument as a child?", "Do you prefer listening to music alone or with friends?"]) },
  // Stage 5
  { id: "p2-w1", stage: 5, skill: "writing", title: "Public transport", writing: w2("Some people think public transport should be free for everyone. Others believe passengers should pay. Discuss both views and give your opinion.") },
  { id: "p2-w2", stage: 5, skill: "writing", title: "Fast food", writing: w2("The consumption of fast food is increasing in many countries. What are the causes of this, and what can be done about it?") },
  { id: "p2-w3", stage: 5, skill: "writing", title: "Gap years", writing: w2("Some students take a year off between school and university to work or travel. Do the advantages of this outweigh the disadvantages?") },
  { id: "p2-s1", stage: 5, skill: "speaking", title: "A useful app", speaking: sp(2, ["Describe an app you find useful."], { topic: "Describe an app you find useful.", bullets: ["what it is", "how you found it", "how often you use it", "and explain why it is useful"] }) },
  { id: "p2-s2", stage: 5, skill: "speaking", title: "Advertising", speaking: sp(3, ["How does advertising influence what people buy?", "Should advertising aimed at children be banned?", "Is online advertising more effective than TV advertising?"]) },
  { id: "p2-s3", stage: 5, skill: "speaking", title: "A person you admire", speaking: sp(2, ["Describe a person you admire."], { topic: "Describe a person you admire.", bullets: ["who this person is", "how you know them", "what they have done", "and explain why you admire them"] }) },
  // Stage 6
  { id: "p3-w1", stage: 6, skill: "writing", title: "Celebrity culture", writing: w2("Young people today are more influenced by celebrities than by their parents or teachers. Why is this the case? Is it a positive or negative development?") },
  { id: "p3-w2", stage: 6, skill: "writing", title: "Tourism", writing: w2("International tourism has brought enormous benefits to many places, but it has also created problems. Do the benefits outweigh the problems?") },
  { id: "p3-w3", stage: 6, skill: "writing", title: "Prison or education", writing: w2("Some people believe that the best way to reduce crime is to give longer prison sentences. Others think there are better alternatives. Discuss both views and give your opinion.") },
  { id: "p3-s1", stage: 6, skill: "speaking", title: "Media & news", speaking: sp(3, ["Do people trust the news less than they used to?", "What responsibility do journalists have to society?", "How can people identify fake news?"]) },
  { id: "p3-s2", stage: 6, skill: "speaking", title: "A change in your life", speaking: sp(2, ["Describe a change that improved your life."], { topic: "Describe a change that improved your life.", bullets: ["what the change was", "when it happened", "how it happened", "and explain how it improved your life"] }) },
  { id: "p3-s3", stage: 6, skill: "speaking", title: "Cities of the future", speaking: sp(3, ["What will cities look like in 50 years?", "Should cars be banned from city centres?", "How can cities become more environmentally friendly?"]) },
  // Stage 7
  { id: "p4-w1", stage: 7, skill: "writing", title: "Genetic engineering", writing: w2("Scientific advances now make it possible to change the genetic characteristics of plants and animals. Is this a positive or negative development?") },
  { id: "p4-w2", stage: 7, skill: "writing", title: "Wealth gap", writing: w2("The gap between the rich and the poor is increasing in many countries. What problems does this cause, and what solutions can you suggest?") },
  { id: "p4-w3", stage: 7, skill: "writing", title: "Universal basic income", writing: w2("Some people argue that governments should pay every citizen a basic income, whether or not they work. To what extent do you agree or disagree?") },
  { id: "p4-s1", stage: 7, skill: "speaking", title: "Full Part 3: Work", speaking: sp(3, ["Is job satisfaction more important than salary?", "Will people work fewer hours in the future?", "How has the idea of a 'career' changed in recent decades?"]) },
  { id: "p4-s2", stage: 7, skill: "speaking", title: "A book that influenced you", speaking: sp(2, ["Describe a book that influenced you."], { topic: "Describe a book that influenced you.", bullets: ["what the book was", "when you read it", "what it was about", "and explain how it influenced you"] }) },
  { id: "p4-s3", stage: 7, skill: "speaking", title: "Full Part 3: Science", speaking: sp(3, ["Should space exploration be funded by governments or private companies?", "Do the benefits of social media outweigh its dangers?", "How should society prepare for automation?"]) },
];
