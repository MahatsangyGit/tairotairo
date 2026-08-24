import { describe, expect, it } from "vitest";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import {
  DEFAULT_SERVICE_COMMISSION_RATE,
  professionalRentalCommissionRate,
  rentalCommissionRate,
  SERVICE_COMMISSION_RATES,
  serviceCommissionRate,
  splitAmount,
  withServiceCommission,
} from "@/lib/economy";

describe("commissions services", () => {
  it("couvre toutes les catégories actives", () => {
    for (const category of SERVICE_CATEGORIES) {
      expect(SERVICE_COMMISSION_RATES[category]).toBeGreaterThan(0);
    }
  });

  it("applique les taux métier", () => {
    expect(serviceCommissionRate("Plomberie")).toBe(0.1);
    expect(serviceCommissionRate("Informatique")).toBe(0.25);
    expect(serviceCommissionRate("Cuisine")).toBe(0.15);
    expect(serviceCommissionRate("Déménagement")).toBe(0.2);
    expect(serviceCommissionRate("Musiques")).toBe(0.25);
  });

  it("retombe à 10 % pour une catégorie inconnue", () => {
    expect(serviceCommissionRate("Inconnue")).toBe(DEFAULT_SERVICE_COMMISSION_RATE);
  });

  it("ne arrondit pas le montant de commission", () => {
    const split = splitAmount(10_001, 0.13);
    expect(split.commissionAmount).toBe(10_001 * 0.13);
    expect(split.net).toBe(10_001 - 10_001 * 0.13);
  });

  it("fige le taux déjà enregistré si le prix change", () => {
    const first = withServiceCommission({
      displayTitle: "Plomberie",
      displayPrice: 50_000,
      displayCategory: "Plomberie",
      displayLocation: "Tana",
      displaySource: "service",
      displayTargetId: "svc_1",
    });
    expect(first.commissionRate).toBe(0.1);
    expect(first.commissionAmount).toBe(5_000);

    const renegotiated = withServiceCommission(
      {
        ...first,
        displayPrice: 80_000,
      },
      first.commissionRate
    );
    expect(renegotiated.commissionRate).toBe(0.1);
    expect(renegotiated.commissionAmount).toBe(8_000);
  });
});

describe("commissions location", () => {
  it("applique 13 % aux particuliers", () => {
    expect(
      rentalCommissionRate({
        isPlatformOwned: false,
        ownerIsProfessionalClient: false,
        totalAmount: 40_000,
      })
    ).toBe(0.13);
  });

  it("applique les paliers pro sur le total", () => {
    expect(professionalRentalCommissionRate(25_000)).toBe(0.3);
    expect(professionalRentalCommissionRate(25_001)).toBe(0.2);
    expect(professionalRentalCommissionRate(45_000)).toBe(0.2);
    expect(professionalRentalCommissionRate(45_001)).toBe(0.15);
  });

  it("applique 0 % au catalogue Tairo", () => {
    expect(
      rentalCommissionRate({
        isPlatformOwned: true,
        ownerIsProfessionalClient: true,
        totalAmount: 10_000,
      })
    ).toBe(0);
  });
});
