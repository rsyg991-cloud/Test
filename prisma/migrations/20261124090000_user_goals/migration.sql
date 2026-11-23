-- Learning goals chosen at onboarding (General English, IELTS, academic study, work), as JSON.
-- Additive and nullable: existing rows keep NULL, which means "the path they always had".
ALTER TABLE "User" ADD COLUMN "goals" TEXT;
