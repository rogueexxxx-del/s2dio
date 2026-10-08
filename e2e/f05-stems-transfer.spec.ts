import { test, expect } from '@playwright/test';

test.describe('F05: Stem Drag-and-Drop and File Management', () => {
  test.beforeEach(async ({ page }) => {
    page.on('response', (res) => {
      if (res.status() >= 500) {
        throw new Error(`HTTP ${res.status()} on ${res.url()}`);
      }
    });
  });

  test('F05-H1: Host opens Stems drawer and views loaded audio stems', async ({ page }) => {
    await page.goto('/session/test-session-1');

    // Open Notes & Stems drawer
    const drawerToggle = page.getByRole('button', { name: 'Notes & Stems' });
    await drawerToggle.click();

    // Switch tab to Stems tab inside drawer using data-glide-id
    const stemsTab = page.locator('button[data-glide-id="files"]');
    await stemsTab.click();

    // Verify stems dropzone and preloaded stems appear
    await expect(page.getByText(/Drop Stems or Audio Files/i)).toBeVisible();
    await expect(page.getByText(/Lead_Vocal_Take1_24bit.wav/i)).toBeVisible();
    await expect(page.getByText(/Drag to DAW/i).first()).toBeVisible();

    // Test API presign validation rejecting invalid mime type
    const response = await page.request.post('/api/sessions/test-session-1/files/presign', {
      data: {
        fileName: 'malware.exe',
        fileSizeBytes: 1024,
        mimeType: 'application/x-msdownload',
      },
    });
    expect(response.status()).toBe(400);
    const errBody = await response.json();
    expect(errBody.error).toMatch(/Upload validation failed|Invalid file type/);

    // Test API presign validation rejecting oversize file (>250MB)
    const oversizeRes = await page.request.post('/api/sessions/test-session-1/files/presign', {
      data: {
        fileName: 'huge_archive.zip',
        fileSizeBytes: 300 * 1024 * 1024,
        mimeType: 'application/zip',
      },
    });
    expect(oversizeRes.status()).toBe(400);
    const quotaBody = await oversizeRes.json();
    expect(quotaBody.error).toBeTruthy();
  });
});
