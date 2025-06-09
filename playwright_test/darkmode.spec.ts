import { expect, test } from "@playwright/test";

// Ganti BASE_URL sesuai environment (ci/cd) ataupun localhost
const BASE_URL = process.env.SMOKE_UI_URL || "http://localhost:3000";

test.describe("Dark Mode Smoke Tests", () => {
  const pages = [
    { name: "Home", path: "/" },
    { name: "Add Book", path: "/add" },
    // NOTE: ubah "1234" jadi ID yang valid jika butuh test detail;
    // kalau belum ada buku, pakai ID random atau buat buku dulu
    { name: "Book Detail", path: "/1" },
  ];

  for (const { name, path } of pages) {
    test(`Toggle Dark Mode on ${name} page`, async ({ page }) => {
      // 1) buka page
      await page.goto(`${BASE_URL}${path}`);

      // 2) referensi elemen <html> dan tombol toggle
      const html = page.locator("html");
      const toggle = page.locator('button[aria-label="Toggle Theme"]');

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
});
