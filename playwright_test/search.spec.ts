import { expect, test } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const email = "test@example.com";
const title = "The Great Gatsby";

test.describe("Search for the new book (Detailed)", () => {
  // Sebelum setiap test pencarian, navigasi ke halaman utama
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`);
    await page.waitForSelector('[data-testid="book-card"]');
  });

  test("substring match: hasil memuat buku yang mengandung sebagian teks judul", async ({
    page,
  }) => {
    // Kita gunakan 'Test Book' sebagai keyword, yang merupakan bagian dari originalTitle
    const keyword = "Great";
    await page.fill("#search-input", keyword);
    await page.press("#search-input", "Enter");
    // Verifikasi bahwa kartu buku kita (yang mengandung publicTitle) terlihat
    const filteredCard = page.locator(
      `[data-testid="book-card"]:has-text("${title}")`,
    );
    await expect(filteredCard).toBeVisible();
    // Verifikasi bahwa semua hasil yang tampil memang mengandung keyword
    const allResults = page.locator('[data-testid="book-card"]');
    for (const card of await allResults.all()) {
      await expect(card).toContainText(keyword, { ignoreCase: true });
    }
  });

  test("case-insensitive: search tidak peka huruf besar/kecil", async ({
    page,
  }) => {
    // Gunakan sebagian judul buku dengan huruf kecil semua
    const keyword = "great";
    await page.fill("#search-input", keyword);
    await page.press("#search-input", "Enter");
    // Verifikasi bahwa kartu buku kita tetap ditemukan
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
});
