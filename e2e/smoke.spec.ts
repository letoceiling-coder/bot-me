import { test, expect } from "@playwright/test";

test.describe("botme smoke", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/bot/i);
  });

  test("login page has form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test("health endpoint responds", async ({ request }) => {
    const base = process.env.E2E_BASE_URL ?? "https://bot-me.neeklo.ru";
    const res = await request.get(`${base}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toMatch(/ok|degraded/);
  });
});
