import { describe, expect, it } from "vitest";
import {
  formatStat,
  isEntrepriseIndividuelle,
  parseNif,
  parseRcs,
  parseStat,
  withEiFlag,
} from "@/lib/provider-legal";
import {
  optionalNifSchema,
  optionalRcsSchema,
  optionalStatSchema,
} from "@/lib/schemas/provider-legal";

describe("NIF Madagascar", () => {
  it("accepte 10 chiffres, avec ou sans espaces", () => {
    expect(parseNif("3002064702")).toBe("3002064702");
    expect(parseNif("1 000 000 052")).toBe("1000000052");
  });

  it("rejette un NIF trop court ou alphabétique", () => {
    expect(parseNif("123456789")).toBeNull();
    expect(parseNif("ABC")).toBeNull();
  });
});

describe("STAT INSTAT", () => {
  it("accepte 17 chiffres (décret 2005-380)", () => {
    expect(parseStat("41002522015000152")).toBe("41002522015000152");
    expect(parseStat("41002 52 2015 0 00152")).toBe("41002522015000152");
    expect(formatStat("41002522015000152")).toBe("41002 52 2015 0 00152");
  });

  it("rejette un STAT incomplet", () => {
    expect(parseStat("41002 52 2015")).toBeNull();
  });
});

describe("RCS Madagascar", () => {
  it("accepte les formats greffe courants", () => {
    expect(parseRcs("RCS/FD/2005/A 00031")).toBe("RCS/FD/2005/A 00031");
    expect(parseRcs("RCS Antananarivo A 2024 00031")).toBe(
      "RCS Antananarivo A 2024 00031"
    );
    expect(parseRcs("RCS Tana 2003B00751")).toBe("RCS Tana 2003B00751");
  });

  it("rejette un RCS sans année ni forme juridique", () => {
    expect(parseRcs("12345")).toBeNull();
    expect(parseRcs("RCS Antananarivo")).toBeNull();
  });
});

describe("badge EI", () => {
  it("exige NIF, STAT et RCS", () => {
    expect(
      isEntrepriseIndividuelle({
        nif: "3002064702",
        stat: "41002522015000152",
        rcs: "RCS/FD/2005/A 00031",
      })
    ).toBe(true);
    expect(
      isEntrepriseIndividuelle({
        nif: "3002064702",
        stat: "41002522015000152",
        rcs: null,
      })
    ).toBe(false);
  });

  it("withEiFlag masque les identifiants publics", () => {
    const out = withEiFlag({
      id: "1",
      name: "Jean",
      nif: "3002064702",
      stat: "41002522015000152",
      rcs: "RCS/FD/2005/A 00031",
    });
    expect(out.isEntrepriseIndividuelle).toBe(true);
    expect(out).not.toHaveProperty("nif");
    expect(out.name).toBe("Jean");
  });
});

describe("schemas optionnels", () => {
  it("accepte vide et normalise", () => {
    expect(optionalNifSchema.parse("")).toBeNull();
    expect(optionalNifSchema.parse("3002064702")).toBe("3002064702");
    expect(optionalStatSchema.parse("41002 52 2015 0 00152")).toBe(
      "41002522015000152"
    );
    expect(optionalRcsSchema.parse("RCS/FD/2005/A 00031")).toBe(
      "RCS/FD/2005/A 00031"
    );
  });
});
