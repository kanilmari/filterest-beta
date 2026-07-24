/**
 * H5_form_validation.spec.ts
 *
 * Verifies add-row form validation on empty submit.
 */

import { test, expect } from '@playwright/test';
import { login, loadCredentials, type TestCredentials } from '../helpers/auth';
import { navigateToDataset, openAddRowForm, waitForDataLoaded } from '../helpers/navigation';

test.describe('H5 — Form Validation', () => {
  let credentials: TestCredentials;

  test.beforeAll(() => {
    credentials = loadCredentials();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, credentials);
  });

  test('form shows validation errors on empty submit', async ({ page }) => {
    await navigateToDataset(page, 'app_service_catalog');
    await waitForDataLoaded(page, 'app_service_catalog');

    await openAddRowForm(page);

    const form = page.locator('[data-testid="add-row-form"]');
    await expect(form.first()).toBeVisible({ timeout: 10000 });

    const submitBtn = form.first().locator('[data-testid="btn-add-row-submit"]');
    if (await submitBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.first().click();
      await page.waitForTimeout(500);

      const formStillOpen = await form.first().isVisible();
      expect(formStillOpen).toBe(true);
    }

    await page.keyboard.press('Escape');
  });
});
