import { expect, test } from "@playwright/test";
import { deleteUser, login, register } from "./e2e-helpers";

// Ganti BASE_URL sesuai environment (ci/cd) ataupun localhost
const BASE_URL = process.env.SMOKE_UI_URL || "http://localhost:3000";
const API_URL = process.env.AWS_API_URL || "http://localhost:3001/api";
const uniqueSuffix = Date.now();
const email = `darkmodeuser-${uniqueSuffix}@example.com`;
const password = "password123";

const pages = [
  { name: "Home", path: "/" },
  { name: "Add Book", path: "/add" },
  // NOTE: ubah "1" jadi ID yang valid jika butuh test detail;
  // kalau belum ada buku, pakai ID random atau buat buku dulu
  { name: "Book Detail", path: "/1" },
  { name: "My Books", path: "/my-books" },
  { name: "Login", path: "/login" },
  { name: "Register", path: "/register" },
];

test.describe("Dark Mode Smoke Tests", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await register(page, email, password);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, email, password);
  });

  for (const { name, path } of pages) {
    test(`Toggle Dark Mode on ${name} page`, async ({ page }) => {
      // 1) buka page
      await page.goto(`${BASE_URL}${path}`);

      // 2) referensi elemen <html> dan tombol toggle
      const html = page.locator("html");
      const toggle = page.locator('button[aria-label="Toggle Theme Website"]');

      // 3) pastikan default *tidak* dark
      await expect(html).not.toHaveClass(/dark/);

      // 4) klik toggle → harus berubah jadi dark
      await toggle.click();
      await expect(html).toHaveClass(/dark/);

      // 5) cek localStorage
      const theme = await page.evaluate(() => localStorage.getItem("theme"));
      expect(theme).toBe("dark");

      // 6) klik lagi → kembali ke light
      await toggle.click();
      await expect(html).not.toHaveClass(/dark/);

      const theme2 = await page.evaluate(() => localStorage.getItem("theme"));
      expect(theme2).toBe("light");
    });
  }

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteUser(page, email, API_URL);
    await page.close();
  });
});
