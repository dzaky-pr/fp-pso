import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function register(
  page: Page,
  email: string,
  password: string = "password123",
) {
  await page.goto(
    `${process.env.SMOKE_UI_URL || "http://localhost:3000"}/register`,
  );
  const dialogPromise = page.waitForEvent("dialog");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  const dialog = await dialogPromise;
  expect(dialog.message()).toContain("Registration successful!");
  await dialog.accept();
}

export async function login(
  page: Page,
  email: string,
  password: string = "password123",
) {
  await page.goto(
    `${process.env.SMOKE_UI_URL || "http://localhost:3000"}/login`,
  );
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(
    `${process.env.SMOKE_UI_URL || "http://localhost:3000"}/`,
  );
}

export async function addBook(
  page: Page,
  {
    title,
    author,
    price,
    description,
    isPrivate = false,
  }: {
    title: string;
    author: string;
    price: string;
    description: string;
    isPrivate?: boolean;
  },
) {
  await page.goto(`${process.env.SMOKE_UI_URL || "http://localhost:3000"}/add`);
  await page.waitForURL(
    `${process.env.SMOKE_UI_URL || "http://localhost:3000"}/add`,
  );
  await page.waitForSelector('input[name="title"]');
  await page.fill('input[name="title"]', title);
  await page.fill('input[name="author"]', author);
  await page.fill('input[name="price"]', price);
  if (isPrivate) await page.click('[data-testid="private-toggle"]');
  await page.fill('textarea[name="description"]', description);
  await page.click('button[type="submit"]');
  await page.waitForURL(
    `${process.env.SMOKE_UI_URL || "http://localhost:3000"}/`,
  );
  await page.waitForSelector('[data-testid="book-card"]', { timeout: 10000 });
  const addedCard = page.locator(
    `[data-testid="book-card"]:has-text("${title}")`,
  );
  await expect(addedCard).toHaveCount(1);
}

export async function removeBook(page: Page, title: string) {
  await page.goto(`${process.env.SMOKE_UI_URL || "http://localhost:3000"}/`);
  const card = page.locator(`[data-testid="book-card"]:has-text("${title}")`);
  const viewButton = card.locator('button:has-text("View Book")');
  await expect(viewButton).toHaveCount(1);
  await viewButton.click();
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  const deleteBtn = page.locator('button:has-text("Delete Book")');
  await expect(deleteBtn).toBeVisible();
  await deleteBtn.click();
  await expect(
    page.locator(`[data-testid="book-card"]:has-text("${title}")`),
  ).toHaveCount(0);
}

export async function deleteUser(
  page: Page,
  email: string,
  API_URL: string = process.env.API_URL || "http://localhost:3000/api",
) {
  const res = await fetch(`${API_URL}/account`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email }),
  });
  expect(res.status).toBe(200); // atau 204 sesuai API-mu
  // Verifikasi bahwa akun telah dihapus
  await page.goto(
    `${process.env.SMOKE_UI_URL || "http://localhost:3000"}/login`,
  );
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  // Verifikasi bahwa login gagal
  const errorMessage = page.locator("text=Invalid credentials");
  await expect(errorMessage).toBeVisible();
}
