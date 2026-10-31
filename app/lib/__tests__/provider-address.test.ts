import { describe, expect, it } from "vitest";
import { parseProviderAddress } from "@/lib/provider-address";
import { registerSchema } from "@/lib/schemas/auth";

const provider = {
  email: "presta@example.com",
  password: "Motdepasse1!",
  phone: "034 00 000 01",
  name: "Andry Rakoto",
  role: "PROVIDER",
};

describe("parseProviderAddress", () => {
  it("accepte lettres, chiffres et espaces simples", () => {
    expect(parseProviderAddress("  Lot IVG 45   Antanimena ")).toBe(
      "Lot IVG 45 Antanimena"
    );
    expect(parseProviderAddress("Ampefiloha2B")).toBe("Ampefiloha2B");
    expect(parseProviderAddress("Lot 1 Ambohimanarina Ankadifotsy")).toBe(
      "Lot 1 Ambohimanarina Ankadifotsy"
    );
  });

  it("refuse la ponctuation et plus de 32 caractères", () => {
    expect(parseProviderAddress("Lot 12, rue Rainandriamampandry")).toBeNull();
    expect(parseProviderAddress("A".repeat(33))).toBeNull();
    expect(parseProviderAddress("   ")).toBeNull();
  });
});

describe("registerSchema — adresse prestataire", () => {
  it("exige l'adresse pour un prestataire", () => {
    expect(registerSchema.safeParse(provider).success).toBe(false);
  });

  it("accepte un prestataire avec une adresse valide", () => {
    const parsed = registerSchema.safeParse({
      ...provider,
      providerAddress: "Lot IVG 45 Antanimena",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.providerAddress).toBe("Lot IVG 45 Antanimena");
    }
  });

  it("refuse une adresse au mauvais format", () => {
    expect(
      registerSchema.safeParse({ ...provider, providerAddress: "Lot 45 / Bis" })
        .success
    ).toBe(false);
  });

  it("n'exige pas d'adresse pour un client particulier", () => {
    expect(
      registerSchema.safeParse({ ...provider, role: "CLIENT" }).success
    ).toBe(true);
  });
});
