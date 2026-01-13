import { test, expect } from '@playwright/test';

test.describe('Editor Functionality', () => {
  test('loads main page elements', async ({ page }) => {
    await page.goto('/');

    // Verify basic elements load quickly
    await expect(page.locator('text=Got an idea')).toBeVisible({ timeout: 5000 });

    const textarea = page.locator('textarea[placeholder*="Ask Lovable to create"]');
    await expect(textarea).toBeVisible();

    const chatButton = page.locator('button:has-text("Chat")');
    await expect(chatButton).toBeVisible();
  });

  test('can interact with UI elements', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await expect(page.locator('text=Got an idea')).toBeVisible();

    // Test input interaction
    const textarea = page.locator('textarea[placeholder*="Ask Lovable to create"]');
    await textarea.fill('Test input');
    await expect(textarea).toHaveValue('Test input');

    // Test button interaction
    const chatButton = page.locator('button:has-text("Chat")');
    await expect(chatButton).toBeEnabled();
  });

  test('shows theme and settings options', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await expect(page.locator('text=Got an idea')).toBeVisible();

    // Check for theme button
    const themeButton = page.locator('button:has-text("Theme")');
    await expect(themeButton).toBeVisible();

    // Check for settings button
    const settingsButton = page.locator('button:has-text("Settings")');
    await expect(settingsButton).toBeVisible();
  });
});