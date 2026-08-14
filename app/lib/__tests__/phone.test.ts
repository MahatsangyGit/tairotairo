import { describe, expect, it } from "vitest";
import {
  formatMgPhone,
  formatMgPhoneInput,
  parseMgPhone,
} from "@/lib/phone";

describe("téléphone Madagascar", () => {
  it("accepte le format 032 74 617 90", () => {
    expect(parseMgPhone("032 74 617 90")).toBe("0327461790");
    expect(parseMgPhone("0327461790")).toBe("0327461790");
    expect(formatMgPhone("0327461790")).toBe("032 74 617 90");
  });

  it("formate la saisie progressivement", () => {
    expect(formatMgPhoneInput("032")).toBe("032");
    expect(formatMgPhoneInput("03274")).toBe("032 74");
    expect(formatMgPhoneInput("03274617")).toBe("032 74 617");
    expect(formatMgPhoneInput("0327461790")).toBe("032 74 617 90");
  });

  it("rejette un numéro trop court ou hors Madagascar", () => {
    expect(parseMgPhone("123")).toBeNull();
    expect(parseMgPhone("0123456789")).toBeNull();
  });
});
