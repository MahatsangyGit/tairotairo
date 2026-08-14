import { describe, expect, it } from "vitest";
import {
  SERVICE_CATEGORIES,
  categoryDbValues,
  normalizeCategoryName,
  resolveCategorySlug,
  slugToCategory,
} from "@/lib/categories";

describe("retired Cours Particuliers category", () => {
  it("is no longer a selectable service category", () => {
    expect(SERVICE_CATEGORIES).not.toContain("Cours Particuliers");
  });

  it("exposes Arts, Musiques, BTP, Couture and Agriculture", () => {
    expect(SERVICE_CATEGORIES).toEqual(
      expect.arrayContaining([
        "Arts",
        "Musiques",
        "BTP",
        "Couture",
        "Agriculture",
      ])
    );
    expect(slugToCategory("arts")).toBe("Arts");
    expect(slugToCategory("musiques")).toBe("Musiques");
    expect(slugToCategory("btp")).toBe("BTP");
    expect(slugToCategory("couture")).toBe("Couture");
    expect(slugToCategory("agriculture")).toBe("Agriculture");
  });

  it("maps legacy names and slugs to Informatique", () => {
    expect(normalizeCategoryName("Cours Particuliers")).toBe("Informatique");
    expect(normalizeCategoryName("Cours")).toBe("Informatique");
    expect(resolveCategorySlug("cours-particuliers")).toBe("informatique");
    expect(resolveCategorySlug("cours")).toBe("informatique");
    expect(slugToCategory("cours-particuliers")).toBe("Informatique");
  });

  it("includes legacy DB values when filtering Informatique", () => {
    const values = categoryDbValues("Informatique");
    expect(values).toEqual(
      expect.arrayContaining(["Informatique", "Cours Particuliers", "Cours"])
    );
  });
});
