import type { FullTest } from "@/lib/mock/schema";
import { originalTest1 } from "./original-test-1";

/** Tests that ship with the app (original Balbal content). Licensed tests are loaded at runtime — see lib/mock/registry.ts. */
export const builtInTests: FullTest[] = [originalTest1];
