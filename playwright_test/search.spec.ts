import { expect, test } from "@playwright/test";
import {
  addBook,
  deleteUser,
  login,
  register,
  removeBook,
} from "./e2e-helpers";

const _BASE_URL = process.env.SMOKE_UI_URL || "http://localhost:3000";
const API_URL = process.env.AWS_API_URL || "http://localhost:3001/api";
const uniqueSuffix = Date.now();
const email = `searchuser-${uniqueSuffix}@example.com`;
const password = "password123";
const title = `Day in a life as Dzaky-${uniqueSuffix}`;

// Register user and add a public book before tests, clean up after

test.describe("Search for the new book (Detailed)", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await register(page, email, password);
    await login(page, email, password);
    await addBook(page, {
      title,
      author: "F. Scott Fitzgerald",
      price: "10.99",
      description: "A classic novel.",
      isPrivate: false,
    });
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, email, password);
    await page.waitForSelector('[data-testid="book-card"]');
  });

  test("substring match: hasil memuat buku yang mengandung sebagian teks judul", async ({
    page,
  }) => {
    const keyword = "Dzaky";
    await page.fill("#search-input", keyword);
    await page.press("#search-input", "Enter");
    const filteredCard = page.locator(
      `[data-testid="book-card"]:has-text("${title}")`,
    );
    await expect(filteredCard).toBeVisible();
    const allResults = page.locator('[data-testid="book-card"]');
    for (const card of await allResults.all()) {
      await expect(card).toContainText(keyword, { ignoreCase: true });
    }
  });

  test("case-insensitive: search tidak peka huruf besar/kecil", async ({
    page,
  }) => {
    const keyword = "life";
    await page.fill("#search-input", keyword);
    await page.press("#search-input", "Enter");
    const filteredCard = page.locator(
      `[data-testid="book-card"]:has-text("${title}")`,
    );
    await expect(filteredCard).toBeVisible();
    expect(await filteredCard.count()).toBeGreaterThan(0);
  });

  test("no-result: menampilkan pesan bila tidak ada match", async ({
    page,
  }) => {
    await page.fill("#search-input", "___BUKU_INI_TIDAK_MUNGKIN_ADA___");
    await page.press("#search-input", "Enter");
    const cards = page.locator('[data-testid="book-card"]');
    await expect(cards).toHaveCount(0);
    const noResult = page.locator("text=No books found matching your search.");
    await expect(noResult).toBeVisible();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, email, password);
    await removeBook(page, title);
    await deleteUser(page, email, API_URL);
    await page.close();
  });
});
