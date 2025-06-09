import { expect, test } from "@playwright/test";

const BASE_URL = process.env.SMOKE_UI_URL || "http://localhost:3000";

test.describe("Search & Filtering di Home (/)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForSelector('[data-testid="book-card"]', { timeout: 10000 });
  });

  test("substring match: hasil memuat buku yang mengandung teks", async ({ page }) => {
    const firstCard = page.locator('[data-testid="book-card"]').first();
    const text = await firstCard.textContent();
    const keyword = text?.split(" ")[0] ?? "a"; // ambil kata pertama atau fallback "a"

    await page.fill('#search-input', keyword);
    await page.press('#search-input', 'Enter');

    const filtered = page.locator(`[data-testid="book-card"]:has-text("${keyword}")`);
    const count = await filtered.count();
    expect(count).toBeGreaterThan(0);
  });

  test("case-insensitive: search tidak peka huruf besar/kecil", async ({ page }) => {
    const firstCard = page.locator('[data-testid="book-card"]').first();
    const text = await firstCard.textContent();
    const keyword = text?.split(" ")[0]?.toLowerCase() ?? "a";

    await page.fill('#search-input', keyword);
    await page.press('#search-input', 'Enter');

    const filtered = page.locator(`[data-testid="book-card"]:has-text("${keyword}")`);
    const count = await filtered.count();
    expect(count).toBeGreaterThan(0);
  });

  test("no-result: menampilkan pesan bila tidak ada match", async ({ page }) => {
    await page.fill('#search-input', "___NOT_EXISTING___");
    await page.press('#search-input', 'Enter');

    const cards = page.locator('[data-testid="book-card"]');
    const total = await cards.count();
    expect(total).toBe(0);

    const noResult = page.locator('text=No books found matching your search.');
    await expect(noResult).toBeVisible();
  });
});
