import { describe, expect, it } from "vitest";
import { normalizeSaudiMobile } from "@/lib/phone";

describe("Saudi mobile numbers", () => {
  it("accepts every common way of writing the same number", () => {
    for (const n of ["0551234567", "551234567", "966551234567", "+966551234567", "00966551234567", "055 123 4567", "+966 55-123-4567", "(055) 1234567", "٠٥٥١٢٣٤٥٦٧", "۰۵۵۱۲۳۴۵۶۷"]) {
      expect(normalizeSaudiMobile(n), n).toBe("+966551234567");
    }
  });

  it("rejects landlines, wrong lengths and other countries", () => {
    for (const n of ["0112345678", "05512345", "05512345678", "0451234567", "+971501234567", "+20551234567", "", "abc", "user@example.com"]) {
      expect(normalizeSaudiMobile(n), n).toBeNull();
    }
    expect(normalizeSaudiMobile(undefined)).toBeNull();
  });
});
