"use client";

import type { Skill } from "@/content/types";
import { useT } from "@/lib/i18n/client";

/** The skill's name in the interface language. Usable from server and client components. */
export function SkillName({ skill }: { skill: Skill }) {
  const { t } = useT();
  return <>{t(`skills.${skill}`)}</>;
}
