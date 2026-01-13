import { test, expect } from '@playwright/test';

test.describe('Project Creation Flow', () => {
  test('loads main page quickly', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Verify we're on the main page quickly
    await expect(page.locator('text=Got an idea')).toBeVisible({ timeout: 5000 });

    // Verify input is available
    const textarea = page.locator('textarea[placeholder*="Ask Lovable to create"]');
    await expect(textarea).toBeVisible();
  });

  test('can enter text in input field', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await expect(page.locator('text=Got an idea')).toBeVisible();

    // Enter a project idea quickly
    const textarea = page.locator('textarea[placeholder*="Ask Lovable to create"]');
    await textarea.fill('Create a simple todo app');

    // Verify text was entered
    await expect(textarea).toHaveValue('Create a simple todo app');
  });

  test('shows settings button', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await expect(page.locator('text=Got an idea')).toBeVisible();

    // Check if settings button exists
    const settingsButton = page.locator('button:has-text("Settings")');
    await expect(settingsButton).toBeVisible();
  });

  test('shows theme selector', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await expect(page.locator('text=Got an idea')).toBeVisible();

    // Check if theme button exists
    const themeButton = page.locator('button:has-text("Theme")');
    await expect(themeButton).toBeVisible();
  });
});