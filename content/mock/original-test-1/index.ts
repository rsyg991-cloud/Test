import { FullTestSchema, type FullTest } from "@/lib/mock/schema";
import { listening } from "./listening";
import { passage1 } from "./reading1";
import { passage2 } from "./reading2";
import { passage3 } from "./reading3";

export const originalTest1: FullTest = FullTestSchema.parse({
  id: "original-test-1",
  title: "BandUp Full Mock Test 1",
  module: "academic",
  description: "A complete IELTS Academic test in the official format: 4 listening parts, 3 reading passages, 2 writing tasks and a 3-part speaking test.",
  source: { kind: "original", publisher: "BandUp" },
  listening,
  reading: [passage1, passage2, passage3],
  writing: {
    task1: {
      task: "task1",
      prompt:
        "The table below shows the percentage of household waste that was recycled in five cities in 2010 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
      chart: {
        kind: "table",
        title: "Household waste recycled (%)",
        unit: "%",
        labels: ["Oslo", "Seoul", "Melbourne", "Toronto", "Dubai"],
        series: [
          { name: "2010", values: [28, 49, 36, 41, 6] },
          { name: "2020", values: [42, 61, 48, 47, 19] },
        ],
      },
      minWords: 150,
    },
    task2: {
      task: "task2",
      prompt:
        "Some people believe that unpaid community service, such as helping in hospitals or cleaning parks, should be a compulsory part of secondary school education. To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.",
      minWords: 250,
    },
  },
  speaking: {
    part1: [
      "Let's talk about the weather. What's the weather usually like where you live?",
      "Do you prefer hot or cold weather? Why?",
      "Has the weather in your country changed in recent years?",
      "Now let's talk about reading. How often do you read for pleasure?",
      "Did you read more as a child than you do now?",
    ],
    part2: {
      topic: "Describe a time when you helped someone.",
      bullets: ["who you helped", "what the situation was", "how you helped", "and explain how you felt about helping this person"],
    },
    part3: [
      "Why do some people enjoy helping others more than others do?",
      "Should schools teach children to help in their community?",
      "Do you think people help their neighbours less than in the past? Why?",
      "Is it the government's responsibility or individuals' responsibility to help people in need?",
    ],
  },
});
