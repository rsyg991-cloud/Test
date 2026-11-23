import type { QuestionGroup } from "@/lib/mock/schema";

export type Skill = "reading" | "listening" | "writing" | "speaking";
export const SKILLS: Skill[] = ["reading", "listening", "writing", "speaking"];

/** Arabic support text for foundation stages (Stages 1–3). Rendered right-to-left. */
type WithArabic = { ar?: string };

export type Question = WithArabic &
  (
  | {
      id: string;
      type: "mcq";
      prompt: string;
      options: string[];
      answer: number;
      explanation: string;
    }
  | {
      id: string;
      type: "tfng";
      prompt: string;
      answer: "TRUE" | "FALSE" | "NOT GIVEN";
      explanation: string;
    }
  | {
      id: string;
      type: "gap";
      prompt: string; // contains ___ where the answer goes
      answer: string[]; // accepted answers (case-insensitive)
      explanation: string;
    }
  );

export interface VocabItem {
  word: string;
  definition: string;
  example: string;
  /** Arabic meaning (foundation stages). */
  ar?: string;
}

export interface ChartData {
  kind: "bar" | "line" | "table";
  title: string;
  unit: string;
  labels: string[];
  series: { name: string; values: number[] }[];
}

export interface ReadingTask {
  title: string;
  paragraphs: string[];
  questions: Question[];
  /** Official IELTS question groups. When present, they replace `questions`. */
  groups?: QuestionGroup[];
  timeMinutes: number;
}

export interface ListeningTask {
  /** Default playback speed. Foundation stages start slower (0.8–0.9). */
  rate?: number;
  context: string;
  script: { speaker: string; voice: "female" | "male"; text: string }[];
  questions: Question[];
  /** Official IELTS question groups. When present, they replace `questions`. */
  groups?: QuestionGroup[];
}

export interface WritingTask {
  task: "task1" | "task2";
  prompt: string;
  chart?: ChartData;
  image?: { src: string; alt: string };
  /** Text description of an image (process, map…) so the AI evaluator can check accuracy. */
  imageDescription?: string;
  minWords: number;
  timeMinutes: number;
  tips: string[];
}

export interface SpeakingTask {
  part: 1 | 2 | 3;
  questions: string[];
  cueCard?: { topic: string; bullets: string[] };
  prepSeconds: number;
  speakSeconds: number;
}

export interface Lesson {
  id: string;
  stage: number;
  unit: number;
  skill: Skill;
  title: string;
  focus: string;
  minutes: number;
  xp: number;
  strategy: { title: string; points: string[] };
  /** The strategy explained in Arabic (foundation stages): shrinks stage by stage. */
  arabic?: { title: string; points: string[] };
  vocab: VocabItem[];
  reading?: ReadingTask;
  listening?: ListeningTask;
  writing?: WritingTask;
  speaking?: SpeakingTask;
  /** Can-do objectives the lesson's exit check measures ("I can ask for a price"). */
  objectives?: string[];
}

/**
 * Learning tracks. Every stage has a General English core; IELTS, EAP and Work are add-on tracks.
 * Tags are metadata only: they never change a lesson's id, stage or a learner's saved progress.
 */
export type Track = "core" | "ielts" | "eap" | "work";
export const TRACKS: Track[] = ["core", "ielts", "eap", "work"];

export interface Unit {
  id: string;
  stage: number;
  index: number;
  title: string;
  theme: string;
  lessons: Lesson[];
}

export interface Checkpoint {
  id: string;
  stage: number;
  title: string;
  reading: ReadingTask;
  listening: ListeningTask;
  writing: WritingTask;
  speaking: SpeakingTask;
}

export interface Stage {
  id: number;
  slug: string;
  name: string;
  camp: string;
  cefr: string;
  bandFrom: number;
  bandTo: number;
  tagline: string;
  description: string;
  goals: Record<Skill, string>;
  /** Arabic name and tagline (foundation stages). */
  arabic?: { name: string; tagline: string };
  /** Foundation stages teach general English before IELTS question types. */
  foundation?: boolean;
  units: Unit[];
  checkpoint: Checkpoint;
}

export interface KeyPhrase {
  phrase: string;
  use: string; // when / why to use it
  example: string;
  /** Arabic meaning (foundation conversations). */
  ar?: string;
}

/** A role-play the learner prepares for on Balbal, then practises with ChatGPT. */
export interface ConversationScenario {
  id: string;
  stage: number;
  title: string;
  situation: string;
  /** Arabic help for the foundation stages: the situation and the grammar point. */
  arabic?: { situation: string; grammar: string };
  ieltsPart: "Part 1" | "Part 2" | "Part 3" | "Full test" | "Real life";
  minutes: number;
  xp: number;
  goals: string[];
  // Learn first
  keyPhrases: KeyPhrase[];
  vocab: VocabItem[];
  grammar: { title: string; explanation: string; examples: string[] };
  modelDialogue: ListeningTask;
  quickCheck: Question[];
  // Role-play with the AI
  aiRole: string;
  learnerRole: string;
  opener: string;
  missions: string[];
  turns: number;
  selfCheck: string[];
}

export interface PracticePrompt {
  id: string;
  stage: number;
  skill: "writing" | "speaking";
  title: string;
  writing?: WritingTask;
  speaking?: SpeakingTask;
}
