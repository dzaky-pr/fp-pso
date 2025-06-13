# Test info

- Name: CRUD Buku via UI >> Add new book
- Location: C:\Users\Frans\Documents\Programming\fp-pso\playwright_test\smoke.spec.ts:21:7

# Error details

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "http://localhost:3000/" until "load"
============================================================
    at C:\Users\Frans\Documents\Programming\fp-pso\playwright_test\smoke.spec.ts:31:16
```

# Page snapshot

```yaml
- banner:
  - heading "Book Library Book Library Halo!" [level=1]:
    - img "Book Library"
    - link "Book Library Halo!":
      - /url: /
  - navigation:
    - link "Home":
      - /url: /
    - link "Add Book":
      - /url: /add
      - button "Add Book"
    - button "Toggle Theme":
      - img
- heading "Add Book" [level=2]
- text: Title
- textbox "Title": E2E Test Book 1749826283247
- text: Author
- textbox "Author": Test Author
- text: Price
- spinbutton "Price"
- text: Description
- textbox "Description": Deskripsi untuk buku test.
- button "Add Book"
- alert
```

# Test source

```ts
   1 | import { expect, test } from "@playwright/test";
   2 |
   3 | // Baca URL dari environment, fallback ke localhost jika tidak diset
   4 | const BASE_URL = process.env.SMOKE_UI_URL || "http://localhost:3000";
   5 | let bookAdded = false;
   6 | let bookEdited = false;
   7 |
   8 | test.describe("Smoke Test UI Dasar", () => {
   9 |   test("Homepage memuat judul 'Explore Our Collections'", async ({ page }) => {
   10 |     await page.goto(`${BASE_URL}/`);
   11 |     await expect(page.locator("h2")).toHaveText(/Explore Our Collections/i);
   12 |   });
   13 | });
   14 |
   15 | test.describe("CRUD Buku via UI", () => {
   16 |   const uniqueSuffix = Date.now();
   17 |   const originalTitle = `E2E Test Book ${uniqueSuffix}`;
   18 |   const updatedTitle = `E2E Updated Book ${uniqueSuffix}`;
   19 |
   20 |   // Test Add New Book
   21 |   test("Add new book", async ({ page }) => {
   22 |     await page.goto(`${BASE_URL}/add`);
   23 |     await page.fill('input[name="title"]', originalTitle);
   24 |     await page.fill('input[name="author"]', "Test Author");
   25 |     // await page.fill('input[name="price"]', "19.99");
   26 |     await page.fill(
   27 |       'textarea[name="description"]',
   28 |       "Deskripsi untuk buku test.",
   29 |     );
   30 |     await page.click('button[type="submit"]');
>  31 |     await page.waitForURL(`${BASE_URL}/`);
      |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
   32 |     await page.waitForSelector('[data-testid="book-card"]', { timeout: 10000 });
   33 |
   34 |     const addedCard = page.locator(
   35 |       `[data-testid="book-card"]:has-text("${originalTitle}")`,
   36 |     );
   37 |     await expect(addedCard).toHaveCount(1);
   38 |     bookAdded = true;
   39 |   });
   40 |
   41 |   test.describe("Search for the new book (Detailed)", () => {
   42 |     test.beforeEach(async ({ page }) => {
   43 |       await page.goto(`${BASE_URL}/`);
   44 |       await page.waitForSelector('[data-testid="book-card"]');
   45 |     });
   46 |
   47 |     // Search tests
   48 |     test("substring match: hasil memuat buku yang mengandung sebagian teks judul", async ({
   49 |       page,
   50 |     }) => {
   51 |       if (!bookAdded) {
   52 |         test.skip(true, "Skipping search tests because no book was added in the previous step.");
   53 |         return;
   54 |       }
   55 |       const keyword = "Test Book";
   56 |       await page.fill("#search-input", keyword);
   57 |       await page.press("#search-input", "Enter");
   58 |
   59 |       const filteredCard = page.locator(
   60 |         `[data-testid="book-card"]:has-text("${originalTitle}")`,
   61 |       );
   62 |       await expect(filteredCard).toBeVisible();
   63 |
   64 |       const allResults = page.locator('[data-testid="book-card"]');
   65 |       for (const card of await allResults.all()) {
   66 |         await expect(card).toContainText(keyword, { ignoreCase: true });
   67 |       }
   68 |     });
   69 |
   70 |     test("case-insensitive: search tidak peka huruf besar/kecil", async ({
   71 |       page,
   72 |     }) => {
   73 |       if (!bookAdded) {
   74 |         test.skip(true, "Skipping search tests because no book was added in the previous step.");
   75 |         return;
   76 |       }
   77 |       const keyword = "e2e test book";
   78 |       await page.fill("#search-input", keyword);
   79 |       await page.press("#search-input", "Enter");
   80 |       const filteredCard = page.locator(
   81 |         `[data-testid="book-card"]:has-text("${originalTitle}")`,
   82 |       );
   83 |       await expect(filteredCard).toBeVisible();
   84 |       expect(await filteredCard.count()).toBeGreaterThan(0);
   85 |     });
   86 |
   87 |     test("no-result: menampilkan pesan bila tidak ada match", async ({
   88 |       page,
   89 |     }) => {
   90 |       if (!bookAdded) {
   91 |         test.skip(true, "Skipping search tests because no book was added in the previous step.");
   92 |         return;
   93 |       }
   94 |       await page.fill("#search-input", "___BUKU_INI_TIDAK_MUNGKIN_ADA___");
   95 |       await page.press("#search-input", "Enter");
   96 |
   97 |       const cards = page.locator('[data-testid="book-card"]');
   98 |       await expect(cards).toHaveCount(0);
   99 |
  100 |       const noResult = page.locator(
  101 |         "text=No books found matching your search.",
  102 |       );
  103 |       await expect(noResult).toBeVisible();
  104 |     });
  105 |   });
  106 |
  107 |   test("Get book detail halaman", async ({ page }) => {
  108 |     if (!bookAdded) {
  109 |       test.skip(true, "Skipping detail tests because no book was added in the previous step.");
  110 |       return;
  111 |     }
  112 |
  113 |     await page.goto(`${BASE_URL}/`);
  114 |     const card = page.locator(
  115 |       `[data-testid="book-card"]:has-text("${originalTitle}")`,
  116 |     );
  117 |     const viewButton = card.locator('button:has-text("View Book")');
  118 |     await expect(viewButton).toHaveCount(1);
  119 |     await viewButton.click();
  120 |     await page.waitForURL(/\/\d+$/);
  121 |
  122 |     await expect(page.locator('input[name="title"]')).toHaveValue(
  123 |       originalTitle,
  124 |     );
  125 |     await expect(page.locator('input[name="author"]')).toHaveValue(
  126 |       "Test Author",
  127 |     );
  128 |   });
  129 |
  130 |   test("Edit existing book", async ({ page }) => {
  131 |     if (!bookAdded) {
```