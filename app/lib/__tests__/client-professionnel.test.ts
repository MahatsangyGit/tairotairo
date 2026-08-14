import { describe, expect, it } from "vitest";
import { isProfessionalClient, parseClientKind } from "@/lib/client-kind";
import { registerSchema } from "@/lib/schemas/auth";

const base = {
  email: "pro@example.com",
  password: "Motdepasse1!",
  phone: "032 74 617 90",
};

describe("client professionnel", () => {
  it("parseClientKind n'accepte que PROFESSIONAL", () => {
    expect(parseClientKind("PROFESSIONAL")).toBe("PROFESSIONAL");
    expect(parseClientKind("CLIENT")).toBe("INDIVIDUAL");
    expect(parseClientKind(undefined)).toBe("INDIVIDUAL");
  });

  it("isProfessionalClient exige rôle CLIENT", () => {
    expect(
      isProfessionalClient({ role: "CLIENT", clientKind: "PROFESSIONAL" })
    ).toBe(true);
    expect(
      isProfessionalClient({ role: "PROVIDER", clientKind: "PROFESSIONAL" })
    ).toBe(false);
    expect(
      isProfessionalClient({ role: "CLIENT", clientKind: "INDIVIDUAL" })
    ).toBe(false);
  });

  it("l'inscription particulière reste valide sans champs société", () => {
    const parsed = registerSchema.safeParse({
      ...base,
      name: "Jean Dupont",
      role: "CLIENT",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phone).toBe("0327461790");
    }
  });

  it("refuse l'inscription sans téléphone", () => {
    const parsed = registerSchema.safeParse({
      email: base.email,
      password: base.password,
      name: "Jean Dupont",
      role: "CLIENT",
    });
    expect(parsed.success).toBe(false);
  });

  it("exige NIF, STAT, RCS, adresse et téléphone pour une entreprise", () => {
    const parsed = registerSchema.safeParse({
      ...base,
      role: "CLIENT",
      clientKind: "PROFESSIONAL",
      companyName: "Andry SARL",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepte une inscription entreprise complète", () => {
    const parsed = registerSchema.safeParse({
      ...base,
      role: "CLIENT",
      clientKind: "PROFESSIONAL",
      companyName: "Andry SARL",
      companyAddress: "Lot II A 12 Antananarivo",
      phone: "0340000000",
      nif: "3002064702",
      stat: "41002 52 2015 0 00152",
      rcs: "RCS Antananarivo A 2024 00031",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.nif).toBe("3002064702");
      expect(parsed.data.stat).toBe("41002522015000152");
    }
  });
});
