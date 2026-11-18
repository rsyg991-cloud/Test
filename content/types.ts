export type Skill = "reading" | "listening" | "writing" | "speaking";
export const SKILLS: Skill[] = ["reading", "listening", "writing", "speaking"];

export type Question =
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
    };

export interface VocabItem {
  word: string;
  definition: string;
  example: string;
}

export interface ChartData {
  kind: "bar" | "line";
  title: string;
  unit: string;
  labels: string[];
  series: { name: string; values: number[] }[];
}

export interface ReadingTask {
  title: string;
  paragraphs: string[];
  questions: Question[];
  timeMinutes: number;
}

export interface ListeningTask {
  context: string;
  script: { speaker: string; voice: "female" | "male"; text: string }[];
  questions: Question[];
}

export interface WritingTask {
  task: "task1" | "task2";
  prompt: string;
  chart?: ChartData;
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
  vocab: VocabItem[];
  reading?: ReadingTask;
  listening?: ListeningTask;
  writing?: WritingTask;
  speaking?: SpeakingTask;
}

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
  units: Unit[];
  checkpoint: Checkpoint;
}

export interface PracticePrompt {
  id: string;
  stage: number;
  skill: "writing" | "speaking";
  title: string;
  writing?: WritingTask;
  speaking?: SpeakingTask;
}
