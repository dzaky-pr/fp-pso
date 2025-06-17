import { expect, test } from "@playwright/test";
import {
  addBook,
  deleteUser,
  login,
  register,
  removeBook,
} from "./e2e-helpers";

const BASE_URL = process.env.SMOKE_UI_URL || "http://localhost:3000";
const API_URL = process.env.AWS_API_URL || "http://localhost:3001/api";
const uniqueSuffix = Date.now();
const email1 = `testuser1-${uniqueSuffix}@example.com`;
const email2 = `testuser2-${uniqueSuffix}@example.com`;
const title1 = "The Great Gatsby";
const title2 = "To Kill a Mockingbird"; //private book
const title3 = "1984";

test.describe("Visibility E2E", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await register(page, email1, "password123");
    await register(page, email2, "password123");
    await login(page, email1, "password123");
    await addBook(page, {
      title: title1,
      author: "F. Scott Fitzgerald",
      price: "10.99",
      description: "A classic novel.",
      isPrivate: false,
    });
    await addBook(page, {
      title: title2,
      author: "F. Scott Fitzgerald",
      price: "15.99",
      description: "A classic novel.",
      isPrivate: true,
    });
    await login(page, email2, "password123");
    await addBook(page, {
      title: title3,
      author: "F. Scott Fitzgerald",
      price: "12.99",
      description: "A classic novel.",
      isPrivate: false,
    });
    await page.close();
  });

  test.describe("visibility testuser1", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, email1, "password123");
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

  test.describe("visibility testuser2", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, email2, "password123");
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

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, email1, "password123");
    await removeBook(page, title1);
    await removeBook(page, title2);
    await login(page, email2, "password123");
    await removeBook(page, title3);
    await deleteUser(page, email1, API_URL);
    await deleteUser(page, email2, API_URL);
    await page.close();
  });
});
