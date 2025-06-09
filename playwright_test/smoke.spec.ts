import { expect, test } from "@playwright/test";

// Baca URL dari environment, fallback ke localhost jika tidak diset
const BASE_URL = process.env.SMOKE_UI_URL || "http://localhost:3000";
// const BASE_URL = "http://localhost:3000";

test.describe("Smoke Test UI Dasar", () => {
  test("Homepage memuat judul 'Explore Our Collections'", async ({ page }) => {
    // Navigasi ke halaman utama
    await page.goto(`${BASE_URL}/`);
    // Verifikasi judul halaman
    await expect(page.locator("h2")).toHaveText(/Explore Our Collections/i);
  });
});

test.describe("CRUD Buku via UI", () => {
  const uniqueSuffix = Date.now();
  const originalTitle = `E2E Test Book ${uniqueSuffix}`;
  const updatedTitle = `E2E Updated Book ${uniqueSuffix}`;

  test("Add new book", async ({ page }) => {
    // 1) Buka form tambah buku
    await page.goto(`${BASE_URL}/add`);
    // 2) Isi form
    await page.fill('input[name="title"]', originalTitle);
    await page.fill('input[name="author"]', "Test Author");
    await page.fill('input[name="price"]', "19.99");
    await page.fill(
      'textarea[name="description"]',
      "Deskripsi untuk buku test.",
    );
    // 3) Submit form
    await page.click('button[type="submit"]');
    // 4) Tunggu redirect ke halaman utama
    await page.waitForURL(`${BASE_URL}/`);
    // 5) Tunggu kartu buku muncul
    await page.waitForSelector('[data-testid="book-card"]', { timeout: 10000 });
    // 6) Verifikasi kartu dengan judul yang sesuai
    const addedCard = page.locator(
      `[data-testid="book-card"]:has-text("${originalTitle}")`,
    );
    await expect(addedCard).toHaveCount(1);
  });

  test("Get book detail halaman", async ({ page }) => {
    // 1) Kembali ke homepage
    await page.goto(`${BASE_URL}/`);
    // 2) Klik 'View Book' pada card yang sesuai
    const card = page.locator(
      `[data-testid="book-card"]:has-text("${originalTitle}")`,
    );
    const viewButton = card.locator('button:has-text("View Book")');
    await expect(viewButton).toHaveCount(1);
    await viewButton.click();
    // 3) Tunggu navigasi ke URL detail (angka saja)
    await page.waitForURL(/\/\d+$/);
    // 4) Verifikasi nilai field
    await expect(page.locator('input[name="title"]')).toHaveValue(
      originalTitle,
    );
    await expect(page.locator('input[name="author"]')).toHaveValue(
      "Test Author",
    );
  });

  test("Edit existing book", async ({ page }) => {
    // 1) Kembali ke homepage dan buka detail buku asli
    await page.goto(`${BASE_URL}/`);
    const card = page.locator(
      `[data-testid="book-card"]:has-text("${originalTitle}")`,
    );
    const viewButton = card.locator('button:has-text("View Book")');
    await expect(viewButton).toHaveCount(1);
    await viewButton.click();
    // 2) Ubah judul
    await page.fill('input[name="title"]', updatedTitle);
    // 3) Siapkan handler untuk dialog konfirmasi
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    // 4) Klik tombol Update Book
    const updateBtn = page.locator('button:has-text("Update Book")');
    await expect(updateBtn).toBeVisible();
    await updateBtn.click();
    // 5) Tunggu redirect kembali ke homepage
    await page.waitForURL(`${BASE_URL}/`);
    // 6) Verifikasi kartu dengan judul yang sudah diupdate
    const updatedCard = page.locator(
      `[data-testid="book-card"]:has-text("${updatedTitle}")`,
    );
    await expect(updatedCard).toHaveCount(1);
  });

  test("Remove book", async ({ page }) => {
    // 1) Kembali ke homepage dan buka detail buku yang sudah diupdate
    await page.goto(`${BASE_URL}/`);
    const card = page.locator(
      `[data-testid="book-card"]:has-text("${updatedTitle}")`,
    );
    const viewButton = card.locator('button:has-text("View Book")');
    await expect(viewButton).toHaveCount(1);
    await viewButton.click();
    // 2) Siapkan handler untuk dialog konfirmasi hapus
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    // 3) Klik tombol Delete Book
    const deleteBtn = page.locator('button:has-text("Delete Book")');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    // 4) Verifikasi kartu sudah tidak ada lagi
    await expect(
      page.locator(`[data-testid="book-card"]:has-text("${updatedTitle}")`),
    ).toHaveCount(0);
  });
});
