import { test, expect } from '@playwright/test';

test.describe('F03 & F04: Audio Mixer, Talkback, and Screen Control Handshake', () => {
  test.beforeEach(async ({ page }) => {
    page.on('response', (res) => {
      if (res.status() >= 500) {
        throw new Error(`HTTP ${res.status()} on ${res.url()}`);
      }
    });
  });

  test('F03-H1: Host opens mixer popover and adjusts channel levels', async ({ page }) => {
    await page.goto('/session/test-session-1');

    // Open mixer popover via Mixer Trims button
    const mixerToggle = page.getByRole('button', { name: /mixer trims/i });
    await mixerToggle.click();

    // Verify channel strips appear
    await expect(page.getByText(/Master DAW/i)).toBeVisible();
    await expect(page.getByText(/Talkback/i).first()).toBeVisible();
    await expect(page.getByText(/Collaborator/i).first()).toBeVisible();

    // Toggle mute on Master DAW using aria-label
    const muteBtn = page.getByRole('button', { name: 'Mute Master DAW' });
    await muteBtn.click();
    await expect(muteBtn).toHaveClass(/bg-accent-red/);

    // Close mixer
    const closeBtn = page.getByRole('button', { name: /close/i });
    await closeBtn.click();
  });

  test('F04-H1: Screen control request from guest to host', async ({ page }) => {
    await page.goto('/guest/test-session-1');

    // Start listening to enter stage
    const listenBtn = page.getByRole('button', { name: /start listening now/i });
    await listenBtn.click();

    // Click request control
    const reqBtn = page.getByRole('button', { name: /request control/i });
    await expect(reqBtn).toBeVisible({ timeout: 10000 });
    await reqBtn.click();

    // Status transitions to Requested
    await expect(page.getByRole('button', { name: /requested/i })).toBeVisible();
  });
});
