-- Three foundation stages (A0 → B1) now come first, so the original four IELTS stages
-- move from 1–4 to 4–7. Shift every stage number stored for existing learners.
-- Lesson and checkpoint ids ("s1-…", "s1-checkpoint") are unchanged, so progress keeps its meaning.
UPDATE "User" SET "startStage" = "startStage" + 3, "unlockedStage" = "unlockedStage" + 3;
UPDATE "LessonProgress" SET "stage" = "stage" + 3;
