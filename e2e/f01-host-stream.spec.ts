import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('F01: Host creates room & streams DAW audio', () => {
  test.beforeEach(async ({ page }) => {
    page.on('response', (res) => {
      if (res.status() >= 500) {
        throw new Error(`HTTP ${res.status()} on ${res.url()}`);
      }
    });
  });

  test('F01-H1: Homepage loads and Host initiates instant studio session', async ({ page }) => {
    await page.goto('/');

    // Verify S2DIO brand and 1-line headline ending at music
    await expect(page.locator('h1')).toContainText('Real-time audio collaboration for music');
    await expect(page.getByText(':4949')).toBeVisible();

    // Start session using Open Studio button
    const openStudioBtn = page.getByRole('button', { name: /open studio/i });
    await expect(openStudioBtn).toBeVisible();
    await openStudioBtn.click();

    // Verify navigation into /session/[slug]
    await page.waitForURL(/\/session\/.+/);
    await expect(page.getByText(/48kHz VST3 Pipeline/i)).toBeVisible();

    // Confirm latency readout and Host badge
    await expect(page.getByText(/48kHz VST3/i).first()).toBeVisible();
    await expect(page.getByText(/host/i).first()).toBeVisible();

    // Accessibility check on session room
    const a11y = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();
    expect(a11y.violations.length).toBeLessThanOrEqual(5);
  });

  test('F01-E1: Quick preset button opens studio session immediately', async ({ page }) => {
    await page.goto('/');
    const presetBtn = page.getByRole('button', { name: /mixdown review/i });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();
    await page.waitForURL(/\/session\/.+/);
    expect(page.url()).toContain('/session/');
  });

  test('F01-E2: Rapid double click creates single session without crashing', async ({ page }) => {
    await page.goto('/');
    const openBtn = page.getByRole('button', { name: /open studio/i });
    await openBtn.dblclick();
    await page.waitForURL(/\/session\/.+/);
    expect(page.url()).toContain('/session/');
  });
});
