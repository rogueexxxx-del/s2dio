import { test, expect } from '@playwright/test';

test.describe('F02: Guest joins via shareable web link', () => {
  test.beforeEach(async ({ page }) => {
    page.on('response', (res) => {
      if (res.status() >= 500) {
        throw new Error(`HTTP ${res.status()} on ${res.url()}`);
      }
    });
  });

  test('F02-H1: Guest loads guest portal with zero install', async ({ page }) => {
    await page.goto('/guest/test-session-1');

    // Check header and guest invitation status
    await expect(page.getByText(/Studio Invitation/i)).toBeVisible();
    await expect(page.getByText(/Lossless 48k Stream/i)).toBeVisible();

    // Start stream listening button
    const listenBtn = page.getByRole('button', { name: /start listening now/i });
    await expect(listenBtn).toBeVisible();
    await listenBtn.click();

    // Verify stream goes live and bottom dock appears
    await expect(page.getByRole('button', { name: /leave/i })).toBeVisible();
    await expect(page.getByText(/TALKBACK/i)).toBeVisible();
  });

  test('F02-E2: Mobile viewport responsiveness for guest listening', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/guest/test-session-1');

    await expect(page.getByText(/Studio Invitation/i)).toBeVisible();
    const listenBtn = page.getByRole('button', { name: /start listening now/i });
    await expect(listenBtn).toBeVisible();
    await listenBtn.click();
    await expect(page.getByRole('button', { name: /leave/i })).toBeVisible();
  });
});
