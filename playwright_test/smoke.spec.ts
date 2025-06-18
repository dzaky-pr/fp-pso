import { expect, test } from "@playwright/test";
import {
  addBook,
  deleteUser,
  login,
  register,
  removeBook,
} from "./e2e-helpers";

// Baca URL dari environment, fallback ke localhost jika tidak diset
const uniqueSuffix = Date.now();
const email = `e2eCRUDuser-${uniqueSuffix}@example.com`;
const BASE_URL = process.env.SMOKE_UI_URL || "http://localhost:3000";
const API_URL = process.env.AWS_API_URL || "http://localhost:3001/api";

let bookAdded = false;
let bookEdited = false;

test.describe("Login and Register", () => {
  test("Register a new user", async ({ page }) => {
    await register(page, email, "password123");
  });

  test("Login with registered user", async ({ page }) => {
    await login(page, email, "password123");
    const menuButton = page.locator(
      `button[aria-label="Toggle Profile Menu"]:has-text("${email}")`,
    );
    await expect(menuButton).toBeVisible();
  });
});

test.describe("CRUD Buku via UI", () => {
  const originalTitle = `E2E Original Book ${uniqueSuffix}`;
  const updatedTitle = `E2E Updated Book ${uniqueSuffix}`;

  test.beforeEach(async ({ page }) => {
    await login(page, email, "password123");
  });

  test("Add new public book", async ({ page }) => {
    await addBook(page, {
      title: originalTitle,
      author: "Test Author",
      price: "19.99",
      description: "Deskripsi untuk buku test.",
      isPrivate: false,
    });
    const addedCard = page.locator(
      `[data-testid="book-card"]:has-text("${originalTitle}")`,
    );
    await expect(addedCard).toHaveCount(1);
    bookAdded = true;
  });

  test("Get book detail halaman", async ({ page }) => {
    test.skip(!bookAdded, "Failed to add book in previous test");
    await page.goto(`${BASE_URL}/`);
    const card = page.locator(
      `[data-testid="book-card"]:has-text("${originalTitle}")`,
    );
    const viewButton = card.locator('button:has-text("View Book")');
    await expect(viewButton).toHaveCount(1);
    await viewButton.click();
    await page.waitForURL(/\/\d+$/);
    await expect(page.locator('input[name="title"]')).toHaveValue(
      originalTitle,
    );
    await expect(page.locator('input[name="author"]')).toHaveValue(
      "Test Author",
    );
  });

  test("Edit existing book", async ({ page }) => {
    test.skip(!bookAdded, "Failed to add book in previous test");
    await page.goto(`${BASE_URL}/`);
    const card = page.locator(
      `[data-testid="book-card"]:has-text("${originalTitle}")`,
    );
    const viewButton = card.locator('button:has-text("View Book")');
    await expect(viewButton).toHaveCount(1);
    await viewButton.click();
    await page.fill('input[name="title"]', updatedTitle);
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    const updateBtn = page.locator('button:has-text("Update Book")');
    await expect(updateBtn).toBeVisible();
    await updateBtn.click();
    await page.waitForURL(`${BASE_URL}/`);
    await page.waitForSelector('[data-testid="book-card"]', { timeout: 30000 });
    const updatedCard = await page.locator(
      `[data-testid="book-card"]:has-text("${updatedTitle}")`,
    );
    await expect(updatedCard).toHaveCount(1);
    bookEdited = true;
  });

  test("Remove book", async ({ page }) => {
    test.skip(!bookEdited, "Failed to edit book in previous test");
    await removeBook(page, updatedTitle);
  });
});

test.describe("Log Out and delete account", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, email, "password123");
  });

  test("Log out'", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const menuButton = page.locator('button[aria-label="Toggle Profile Menu"]');
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    const logOutButton = page.locator('button:has-text("Log Out")');
    await expect(logOutButton).toBeVisible();
    await logOutButton.click();
    await page.waitForURL(`${BASE_URL}/login`);
    expect(page.url()).toBe(`${BASE_URL}/login`);
  });

  test("Delete account", async ({ page }) => {
    await deleteUser(page, email, API_URL);
  });
});
