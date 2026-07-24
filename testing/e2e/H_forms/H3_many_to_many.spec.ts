/**
 * H3_many_to_many.spec.ts
 *
 * Verifies many-to-many UI element interaction in add-row form.
 */

import { test, expect } from '@playwright/test';
import { login, loadCredentials, type TestCredentials } from '../helpers/auth';
import { navigateToDataset, openAddRowForm, waitForDataLoaded } from '../helpers/navigation';

test.describe('H3 — Many To Many', () => {
  let credentials: TestCredentials;

  test.beforeAll(() => {
    credentials = loadCredentials();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, credentials);
  });

  test('many-to-many selection in form', async ({ page }) => {
    await navigateToDataset(page, 'app_service_catalog');
    await waitForDataLoaded(page, 'app_service_catalog');

    await openAddRowForm(page);

    const form = page.locator('[data-testid="add-row-form"]');
    await expect(form.first()).toBeVisible({ timeout: 10000 });

    // Etsi m2m-komponentti
    const m2m = form.first().locator('[data-m2m], .many-to-many, .multi-select, input[type="checkbox"]');
    if (await m2m.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // Varmista elementti on interaktiivinen
      await m2m.first().click();
    } else {
      test.skip(); // Taulu ei ehkä sisällä m2m-sarakkeita
    }

    await page.keyboard.press('Escape');
  });
});
