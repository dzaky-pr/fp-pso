import { expect, test } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const email1 = "test@example.com";
const email2 = "user@example.com";
const title1 = "The Great Gatsby";
const title2 = "To Kill a Mockingbird";
const title3 = "1984";

test.describe("visibility test@example.com", () => {
  test.beforeEach("Login to existing User", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', email1);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`);
  });

  test("View My Books", async ({ page }) => {
    await page.goto(`${BASE_URL}/my-books`);
    await page.waitForSelector('[data-testid="book-card"]');
    const cardTitle1 = page.locator(
      `[data-testid="book-card"]:has-text("${title1}")`,
    );
    await expect(cardTitle1).toHaveCount(1);

    const cardTitle2 = page.locator(
      `[data-testid="book-card"]:has-text("${title2}")`,
    );
    await expect(cardTitle2).toHaveCount(1);
  });

  test("View Public Books", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForSelector('[data-testid="book-card"]');
    const cardTitle1 = page.locator(
      `[data-testid="book-card"]:has-text("${title1}")`,
    );
    await expect(cardTitle1).toHaveCount(1);

    const cardTitle2 = page.locator(
      `[data-testid="book-card"]:has-text("${title2}")`,
    );
    await expect(cardTitle2).toHaveCount(1);

    const cardTitle3 = page.locator(
      `[data-testid="book-card"]:has-text("${title3}")`,
    );
    await expect(cardTitle3).toHaveCount(1);
  });
});

test.describe("visibility user@example.com", () => {
  test.beforeEach("Login to existing User", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', email2);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`);
  });

  test("View My Books", async ({ page }) => {
    await page.goto(`${BASE_URL}/my-books`);
    await page.waitForSelector('[data-testid="book-card"]');
    const cardTitle1 = page.locator(
      `[data-testid="book-card"]:has-text("${title3}")`,
    );
    await expect(cardTitle1).toHaveCount(1);
  });

  test("View Public Books", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForSelector('[data-testid="book-card"]');
    const cardTitle1 = page.locator(
      `[data-testid="book-card"]:has-text("${title1}")`,
    );
    await expect(cardTitle1).toHaveCount(1);

    const cardTitle2 = page.locator(
      `[data-testid="book-card"]:has-text("${title2}")`,
    );
    await expect(cardTitle2).toHaveCount(0);

    const cardTitle3 = page.locator(
      `[data-testid="book-card"]:has-text("${title3}")`,
    );
    await expect(cardTitle3).toHaveCount(1);
  });
});
