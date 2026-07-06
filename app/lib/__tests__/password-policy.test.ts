import { describe, expect, it } from "vitest";
import { validatePassword, MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

describe("password-policy", () => {
  it("rejects short passwords", () => {
    const result = validatePassword("Ab1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain(String(MIN_PASSWORD_LENGTH));
    }
  });

  it("requires mixed case and digit", () => {
    expect(validatePassword("alllowercase1").ok).toBe(false);
    expect(validatePassword("ALLUPPERCASE1").ok).toBe(false);
    expect(validatePassword("NoDigitsHere").ok).toBe(false);
  });

  it("accepts strong password", () => {
    expect(validatePassword("Str0ngPassw0rd").ok).toBe(true);
  });
});
