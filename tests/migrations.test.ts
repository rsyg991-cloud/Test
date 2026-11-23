import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * From the curriculum redesign on, migrations may only add: new tables, indexes and nullable or
 * defaulted columns. Nothing that rewrites, renames or removes data existing learners depend on.
 */
const FIRST_REDESIGN_MIGRATION = "20261124000000";

describe("database migrations (AC-26)", () => {
  const dirs = readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name >= FIRST_REDESIGN_MIGRATION)
    .map((d) => d.name);

  it("are additive only", () => {
    for (const dir of dirs) {
      const sql = readFileSync(`prisma/migrations/${dir}/migration.sql`, "utf8")
        .replace(/--.*$/gm, "")
        .trim();
      for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
        expect(statement, dir).toMatch(/^(CREATE (TABLE|UNIQUE INDEX|INDEX)|ALTER TABLE "\w+" ADD COLUMN "\w+" \w+( NOT NULL DEFAULT .+)?$)/s);
        expect(statement, dir).not.toMatch(/\b(DROP|DELETE|UPDATE|RENAME|TRUNCATE)\b/i);
      }
    }
  });
});
