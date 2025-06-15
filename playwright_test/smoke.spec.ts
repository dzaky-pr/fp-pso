import { expect, test } from "@playwright/test";

// Baca URL dari environment, fallback ke localhost jika tidak diset
const uniqueSuffix = Date.now();
const email = `e2eCRUDuser-${uniqueSuffix}@example.com`;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let bookAdded = false;
let bookEdited = false;

test.describe("Login and Register", () => {
  test("Register a new user", async ({ page }) => {
    // 1) Buka halaman register
    await page.goto(`${BASE_URL}/register`);
    // 2) Isi form register
    // Pasang handler dialog sebelum submit
    const dialogPromise = page.waitForEvent("dialog");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "password123");
    // 3) Submit form
    await page.click('button[type="submit"]');
    // 4) Verifikasi bahwa pengguna berhasil terdaftar
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain("Registration successful!");
    await dialog.accept();
  });

  test("Login with registered user", async ({ page }) => {
    // 1) Buka halaman login
    await page.goto(`${BASE_URL}/login`);
    // 2) Isi form login
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "password123");
    // 3) Submit form
    await page.click('button[type="submit"]');
    // 4) Verifikasi redirect ke homepage
    await page.waitForURL(`${BASE_URL}/`);
    expect(page.url()).toBe(`${BASE_URL}/`);
    await expect(page.locator("h2")).toHaveText(/Explore Our Collections/i);
  });
});

test.describe("CRUD Buku via UI", () => {
  // const uniqueSuffix = Date.now();
  const originalTitle = `E2E Original Book ${uniqueSuffix}`;
  const updatedTitle = `E2E Updated Book ${uniqueSuffix}`;

  // Login ulang sebelum setiap test yang butuh session
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`);
  });

  test("Add new public book", async ({ page }) => {
    await page.goto(`${BASE_URL}/add`);
    await page.waitForURL(`${BASE_URL}/add`);
    // // 1) Buka form tambah buku
    // 2) Isi form
    await page.waitForSelector('input[name="title"]');
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
    bookAdded = true;
  });

  test("Get book detail halaman", async ({ page }) => {
    test.skip(!bookAdded, "Failed to add book in previous test");
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
    test.skip(!bookAdded, "Failed to add book in previous test");
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
    // 6) Tunggu kartu buku muncul dan log semua judul buku
    await page.waitForSelector('[data-testid="book-card"]', { timeout: 15000 });
    const _allTitles = await page
      .locator('[data-testid="book-card"]')
      .allTextContents();
    const updatedCard = await page.locator(
      `[data-testid="book-card"]:has-text("${updatedTitle}")`,
    );
    await expect(updatedCard).toHaveCount(1);
    bookEdited = true;
  });

  test("Remove book", async ({ page }) => {
    test.skip(!bookEdited, "Failed to edit book in previous test");
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

test.describe("Log Out and delete account", () => {
  test("Log out'", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`);
    // Navigasi ke halaman About
    await page.goto(`${BASE_URL}/`);
    // Verifikasi judul halaman
    const logOutButton = page.locator('button:has-text("Logout")');
    await expect(logOutButton).toBeVisible();
    // Klik tombol Log Out
    await logOutButton.click();
    // Verifikasi redirect ke halaman login
    await page.waitForURL(`${BASE_URL}/login`);
    expect(page.url()).toBe(`${BASE_URL}/login`);
  });

  test("Delete account", async ({ page }) => {
    const res = await fetch("http://localhost:3001/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email }),
    });
    expect(res.status).toBe(200); // atau 204 sesuai API-mu
    // Verifikasi bahwa akun telah dihapus
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    // Verifikasi bahwa login gagal
    const errorMessage = page.locator("text=Invalid credentials");
    await expect(errorMessage).toBeVisible();
  });
});
