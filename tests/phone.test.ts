import { describe, expect, it } from "vitest";
import { normalizePhone, normalizeSaudiMobile } from "@/lib/phone";

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

describe("mobile numbers from any country", () => {
  it("keeps Saudi numbers exactly as before, whatever country is picked when the + is written", () => {
    expect(normalizePhone("0551234567")).toBe("+966551234567");
    expect(normalizePhone("055 123 4567", "SA")).toBe("+966551234567");
    expect(normalizePhone("+966551234567", "AE")).toBe("+966551234567");
    expect(normalizePhone("00966551234567", "EG")).toBe("+966551234567");
    expect(normalizePhone("٠٥٥١٢٣٤٥٦٧", "SA")).toBe("+966551234567");
  });

  it("reads a local number in the picked country", () => {
    expect(normalizePhone("050 123 4567", "AE")).toBe("+971501234567");
    expect(normalizePhone("٠٥٠١٢٣٤٥٦٧", "AE")).toBe("+971501234567");
    expect(normalizePhone("01012345678", "EG")).toBe("+201012345678");
    expect(normalizePhone("07911 123456", "GB")).toBe("+447911123456");
    expect(normalizePhone("5001 2345", "KW")).toBe("+96550012345");
  });

  it("reads a full international number whatever country is picked", () => {
    expect(normalizePhone("+971 50 123 4567", "SA")).toBe("+971501234567");
    expect(normalizePhone("0020 101 234 5678", "SA")).toBe("+201012345678");
    expect(normalizePhone("+1 202 555 0123", "SA")).toBe("+12025550123");
  });

  it("rejects landlines, wrong lengths, unknown countries and junk", () => {
    for (const [n, c] of [["0112345678", "SA"], ["+966112345678", "AE"], ["04 234 5678", "AE"], ["0501234", "AE"], ["123", "US"], ["0551234567", "XX"], ["abc", "SA"], ["user@example.com", "SA"], ["", "SA"]]) {
      expect(normalizePhone(n, c), `${n} ${c}`).toBeNull();
    }
    expect(normalizePhone(undefined)).toBeNull();
  });
});
