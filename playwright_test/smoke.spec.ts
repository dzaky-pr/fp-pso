import { expect, test } from "@playwright/test";

// Baca URL dari environment, agar fleksibel untuk staging/production.
const BASE_URL = process.env.SMOKE_UI_URL || "https://staging.your-app.com";

test.describe("Smoke Test UI Dasar", () => {
  test("Homepage memuat judul ‘Explore Our Collections’", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await expect(page.locator("h2")).toHaveText(/Explore Our Collections/i);
  });

  test("Halaman /books memuat setidaknya satu kartu buku", async ({ page }) => {
    await page.goto(`${BASE_URL}/books`);
    await page.waitForSelector(".book-card", { timeout: 10000 });
    const cards = await page.$$(".book-card");
    expect(cards.length).toBeGreaterThan(0);
  });
});

test.describe("CRUD Buku via UI", () => {
  // Gunakan judul unik untuk menghindari bentrok dengan data existing
  const uniqueSuffix = Date.now();
  const originalTitle = `E2E Test Book ${uniqueSuffix}`;
  const updatedTitle = `E2E Updated Book ${uniqueSuffix}`;

  test("Add new book", async ({ page }) => {
    // 1) Buka halaman 'Add Book'
    await page.goto(`${BASE_URL}/add`);

    // 2) Isi form tambah buku (sesuaikan nama input jika berbeda)
    await page.fill('input[name="title"]', originalTitle);
    await page.fill('input[name="author"]', "Test Author");
    await page.fill('input[name="price"]', "19.99");
    await page.fill(
      'textarea[name="description"]',
      "Deskripsi untuk buku test.",
    );

    // 3) Klik tombol Submit (sesuaikan selector tombol sumbit)
    await page.click('button[type="submit"]');

    // 4) Setelah submit, seharusnya diarahkan ke /books (atau halaman yang menampilkan daftar)
    await page.waitForURL(`${BASE_URL}/books`);
    await page.waitForSelector(".book-card", { timeout: 10000 });

    // 5) Cari kartu buku yang baru saja ditambahkan
    const addedCard = page.locator(`.book-card:has-text("${originalTitle}")`);
    await expect(addedCard).toHaveCount(1);
  });

  test("Get book detail halaman (UI)", async ({ page }) => {
    // 1) Buka daftar buku
    await page.goto(`${BASE_URL}/books`);

    // 2) Klik kartu buku yang sudah ditambahkan
    //    Misal tiap .book-card berisi link ke detail, klik saja judulnya
    const cardLink = page.locator(`.book-card:has-text("${originalTitle}") a`);
    await expect(cardLink).toHaveCount(1);
    await cardLink.click();

    // 3) Tunggu halaman detail terbuka; misal URL mengandung /books/{id}
    await page.waitForURL(/\/books\/\d+$/);

    // 4) Verifikasi konten detail: misal ada element yang menampilkan judul
    await expect(page.locator("h1")).toHaveText(originalTitle);
    await expect(page.locator("text=Test Author")).toBeVisible();
  });

  test("Edit existing book", async ({ page }) => {
    // 1) Buka halaman daftar buku
    await page.goto(`${BASE_URL}/books`);

    // 2) Temukan tombol "Edit" pada kartu buku yang berjudul originalTitle
    //    Misal dalam .book-card ada tombol atau link dengan teks "Edit"
    const editButton = page.locator(
      `.book-card:has-text("${originalTitle}") >> text=Edit`,
    );
    await expect(editButton).toHaveCount(1);
    await editButton.click();

    // 3) Tunggu halaman edit terbuka; misal URL mengandung /books/edit/{id}
    await page.waitForURL(/\/books\/edit\/\d+$/);

    // 4) Ubah judul, misal clear field lalu isi updatedTitle
    await page.fill('input[name="title"]', updatedTitle);

    // 5) Klik tombol Save/Update (sesuaikan selector)
    await page.click('button[type="submit"]');

    // 6) Kembali ke /books, pastikan judul sudah ter-update
    await page.waitForURL(`${BASE_URL}/books`);
    await page.waitForSelector(".book-card", { timeout: 10000 });
    const updatedCard = page.locator(`.book-card:has-text("${updatedTitle}")`);
    await expect(updatedCard).toHaveCount(1);
  });

  test("Remove book", async ({ page }) => {
    // 1) Buka daftar buku
    await page.goto(`${BASE_URL}/books`);

    // 2) Temukan tombol "Delete" pada kartu buku yang berjudul updatedTitle
    const deleteButton = page.locator(
      `.book-card:has-text("${updatedTitle}") >> text=Delete`,
    );
    await expect(deleteButton).toHaveCount(1);
    await deleteButton.click();

    // 3) Konfirmasi penghapusan jika perlu; misal muncul dialog
    //    Jika ada pop-up konfirmasi, uncomment:
    // await page.click('button:has-text("Yes, delete")');

    // 4) Tunggu book card hilang
    await expect(
      page.locator(`.book-card:has-text("${updatedTitle}")`),
    ).toHaveCount(0);
  });
});
