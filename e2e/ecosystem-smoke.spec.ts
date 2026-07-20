import { test, expect } from "@playwright/test";

/**
 * Smoke tests for ecosystem verticals (pages accessible without auth).
 * Full rental/learning flows require seeded DB + migrations applied.
 */
test.describe("Écosystème ampindramo / ampianaro", () => {
  test("catalogue ampindramo charge", async ({ page }) => {
    const res = await page.goto("/ampindramo");
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Empruntez|matériel/i
    );
  });

  test("catalogue ampianaro charge", async ({ page }) => {
    const res = await page.goto("/ampianaro");
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Apprenez|DIY|formations/i
    );
  });

  test("API catalogue matériel répond", async ({ request }) => {
    const res = await request.get("/api/rental/equipment?limit=1");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("API catalogue formations répond", async ({ request }) => {
    const res = await request.get("/api/learning/courses?limit=1");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("courses");
    expect(Array.isArray(body.courses)).toBe(true);
  });
});
