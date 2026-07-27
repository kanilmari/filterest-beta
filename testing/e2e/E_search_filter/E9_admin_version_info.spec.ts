/**
 * E9_admin_version_info.spec.ts
 *
 * Verifies the admin-only filterbar version indicator against the running app.
 * Bridges protected version metadata with the visible clock-bar placement contract.
 * Exists so product/DB support details stay available without shifting the centered clock.
 */

import { test, expect } from '@playwright/test';
import { login, loadCredentials, type TestCredentials } from '../helpers/auth';
import { openActiveFilterbarIfCollapsed } from '../helpers/filterbar';
import { navigateToDataset } from '../helpers/navigation';

test.describe('E9 — Admin version info', () => {
  let credentials: TestCredentials;

  test.beforeAll(() => {
    credentials = loadCredentials();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, credentials);
  });

  test('shows protected app and database versions at the clock-bar edge', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.metadata?.screenWidth !== 'desktop',
      'This placement proof drives its own viewport and only needs one project.',
    );

    await page.setViewportSize({ width: 1024, height: 768 });
    await navigateToDataset(page, 'app_service_catalog');
    await openActiveFilterbarIfCollapsed(page);

    const indicator = page.locator('[data-testid="filterbar-admin-version-info"]').first();
    await expect(indicator).toBeVisible({ timeout: 10000 });

    const response = await page.request.get('/api/admin/version-info');
    expect(response.status()).toBe(200);
    const versionInfo = await response.json();
    expect(versionInfo).toMatchObject({
      product_name: 'Easelect',
      db_compatible: true,
    });
    expect(versionInfo.app_version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(versionInfo.db_version).toMatch(/^\d+\.\d+\.\d+$/);

    await indicator.hover();
    await expect(indicator).toHaveAttribute(
      'title',
      new RegExp(
        `Easelect: ${versionInfo.app_version}.*Database: ${versionInfo.db_version}`,
        's',
      ),
    );

    const placement = await indicator.evaluate((element) => {
      const indicatorBox = element.getBoundingClientRect();
      const clockBarBox = element.closest('.filterbar-clock-bar')?.getBoundingClientRect();
      if (!clockBarBox) {
        throw new Error('Version indicator is not mounted in the filterbar clock bar.');
      }
      return {
        rightGap: clockBarBox.right - indicatorBox.right,
        verticalCenterDelta:
          indicatorBox.top + indicatorBox.height / 2
          - (clockBarBox.top + clockBarBox.height / 2),
      };
    });

    expect(placement.rightGap).toBeCloseTo(8, 0);
    expect(Math.abs(placement.verticalCenterDelta)).toBeLessThanOrEqual(1);
  });
});
