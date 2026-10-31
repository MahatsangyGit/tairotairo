import { describe, expect, it } from "vitest";
import { parseProviderAddress } from "@/lib/provider-address";
import { MADAGASCAR_CITIES } from "@/lib/madagascar-cities";
import { registerSchema } from "@/lib/schemas/auth";
import {
  createRequestSchema,
  createServiceSchema,
  patchRequestSchema,
  patchServiceSchema,
} from "@/lib/schemas/listings";
import { createEquipmentSchema } from "@/lib/schemas/rental";

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

describe("communes urbaines de Madagascar", () => {
  it("compte 76 noms uniques", () => {
    const names = MADAGASCAR_CITIES.map((city) => city.name);
    expect(new Set(names).size).toBe(76);
    expect(names).toContain("Antananarivo");
    expect(names).toContain("Toamasina");
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
      providerCity: "Antananarivo",
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

  it("refuse une ville hors référentiel", () => {
    expect(
      registerSchema.safeParse({
        ...provider,
        providerAddress: "Lot IVG 45 Antanimena",
        providerCity: "Tana",
      }).success
    ).toBe(false);
  });

  it("n'exige pas d'adresse pour un client particulier", () => {
    expect(
      registerSchema.safeParse({ ...provider, role: "CLIENT" }).success
    ).toBe(true);
  });
});

describe("schémas d'annonces — ville officielle", () => {
  const baseService = {
    title: "Réparation fuite d'eau",
    description: "Intervention rapide à domicile",
    category: "Plomberie",
    price: 50000,
  };

  it("accepte une ville de la liste officielle sur service, demande et matériel", () => {
    expect(
      createServiceSchema.safeParse({ ...baseService, location: "Antananarivo" })
        .success
    ).toBe(true);
    expect(
      createRequestSchema.safeParse({
        title: "Besoin plombier",
        description: "Fuite sous évier",
        category: "Plomberie",
        budget: 40000,
        location: "Toamasina",
      }).success
    ).toBe(true);
    expect(
      createEquipmentSchema.safeParse({
        title: "Perceuse à percussion",
        description: "En parfait état",
        category: "POWER_TOOLS",
        dailyPrice: 15000,
        location: "Nosy Be",
      }).success
    ).toBe(true);
  });

  it("refuse une ville hors liste officielle à la création et à la modification", () => {
    expect(
      createServiceSchema.safeParse({ ...baseService, location: "Tana" })
        .success
    ).toBe(false);
    expect(
      patchServiceSchema.safeParse({ location: "Quartier libre" }).success
    ).toBe(false);
    expect(
      patchRequestSchema.safeParse({ location: "Inconnu" }).success
    ).toBe(false);
    expect(patchServiceSchema.safeParse({ price: 60000 }).success).toBe(true);
  });
});
