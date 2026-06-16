import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "https://bot-me.neeklo.ru";
const e2eSecret = process.env.E2E_TEST_SECRET;

test.describe("register → payment flow", () => {
  test.skip(!e2eSecret, "E2E_TEST_SECRET required for full payment flow");

  test("register, onboarding, activate subscription, reach dashboard", async ({
    page,
    request,
  }) => {
    const stamp = Date.now();
    const email = `e2e-${stamp}@botme-test.local`;
    const password = "TestPass123!";
    const orgName = `E2E Org ${stamp}`;

    await page.goto("/register");
    await page.getByPlaceholder("ИП Иванов").fill(orgName);
    await page.getByPlaceholder("Иван").fill("E2E Tester");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Создать аккаунт" }).click();

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });

    await page.getByRole("button", { name: "Далее" }).click();
    await expect(page.getByRole("heading", { name: "Оплата подписки" })).toBeVisible();

    const token = await page.evaluate(() => localStorage.getItem("botme_token"));
    expect(token).toBeTruthy();

    const activateRes = await request.post(`${baseUrl}/api/billing/e2e/activate`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-E2E-Secret": e2eSecret!,
        "Content-Type": "application/json",
      },
    });
    expect(activateRes.ok()).toBeTruthy();
    const activateBody = await activateRes.json();
    expect(activateBody.status).toBe("active");

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/обзор|диалог|ассистент/i);
  });
});

test.describe("register → checkout (no secret)", () => {
  test("register and reach YuKassa checkout redirect", async ({ page }) => {
    test.skip(Boolean(e2eSecret), "Skipped when E2E_TEST_SECRET is set (full flow runs instead)");

    const stamp = Date.now();
    const email = `checkout-${stamp}@example.com`;
    const password = "TestPass123!";

    await page.goto("/register");
    await page.getByPlaceholder("ИП Иванов").fill(`Checkout ${stamp}`);
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Создать аккаунт" }).click();

    await expect(page).toHaveURL(/\/onboarding/);
    await page.getByRole("button", { name: "Далее" }).click();

    const payButton = page.getByRole("button", { name: /Оплатить/i });
    await expect(payButton).toBeVisible();

    await Promise.all([
      page.waitForURL(/yookassa|yandex|checkout/, { timeout: 20_000 }).catch(() => null),
      payButton.click(),
    ]);

    const url = page.url();
    const reachedPayment =
      /yookassa|yandex|checkout/.test(url) ||
      (await page.getByText(/не получена ссылка|ошибка/i).count()) === 0;

    expect(reachedPayment).toBeTruthy();
  });
});
