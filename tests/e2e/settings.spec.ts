import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { seededApp, stored } from './helpers';

test('PIN lock: set, lock on reload, wrong PIN rejected, right PIN unlocks, turn off', async ({ page }) => {
  await seededApp(page, '#/settings');
  await page.getByLabel('New PIN (4–6 digits)').fill('2468');
  await page.getByLabel('Confirm PIN').fill('2469');
  await page.getByRole('button', { name: 'Set PIN' }).click();
  await expect(page.getByText('The PINs don’t match.')).toBeVisible();
  await page.getByLabel('Confirm PIN').fill('2468');
  await page.getByRole('button', { name: 'Set PIN' }).click();
  await expect(page.getByText('PIN lock is on.').first()).toBeVisible();
  const d = await stored(page);
  expect(d.settings.pinHash).toMatch(/^[0-9a-f]{64}$/);
  expect(JSON.stringify(d)).not.toContain('2468');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Tidewise is locked' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Call 911' })).toBeVisible();
  await page.getByLabel('Enter your PIN').fill('1111');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByRole('alert')).toHaveText('That PIN isn’t right. Try again.');
  await page.getByLabel('Enter your PIN').fill('2468');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Turn off PIN' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
});

test('export backup → delete everything → restore from welcome screen', async ({ page }) => {
  await seededApp(page, '#/settings');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export backup' }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^tidewise-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await dl.path();
  const json = JSON.parse(readFileSync(path!, 'utf8'));
  expect(json.app).toBe('tidewise');
  expect(json.data.profile.name).toBe('Alex');

  await page.getByRole('button', { name: 'Delete all data' }).click();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  await expect(page.getByRole('heading', { name: 'Tidewise' })).toBeVisible();
  expect((await stored(page)).profile).toBeNull();

  await page.getByTestId('import-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"nope":1}') });
  await expect(page.getByRole('alert')).toContainText('Unsupported or missing data version');
  await page.getByTestId('import-file').setInputFiles(path!);
  await expect(page.getByRole('heading', { name: /Alex/ })).toBeVisible();
  await expect(page.getByTestId('streak')).toHaveText('9');
});

test('theme toggle and plan edit', async ({ page }) => {
  await seededApp(page, '#/settings');
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('radio', { name: 'System' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);

  await page.getByLabel('Quit day').fill('2026-10-25');
  await page.getByRole('button', { name: 'Update plan' }).click();
  await expect(page.getByText('Plan updated.')).toBeVisible();
  await page.goto('/');
  await expect(page.getByTestId('streak')).toHaveText('6');
});

test('retake safety screen updates the risk level', async ({ page }) => {
  await seededApp(page, '#/screening');
  await page.getByRole('radiogroup', { name: /seizure/ }).getByRole('radio', { name: 'Yes' }).click();
  for (const g of await page.getByRole('radiogroup').all()) {
    const yes = g.getByRole('radio', { name: 'Yes', exact: true });
    if ((await yes.count()) && (await g.getByRole('radio', { name: 'No', exact: true }).getAttribute('aria-checked')) === 'false' && (await yes.getAttribute('aria-checked')) === 'false')
      await g.getByRole('radio', { name: 'No', exact: true }).click();
  }
  await expect(page.getByTestId('risk-high')).toBeVisible();
  await page.getByRole('button', { name: 'Save results' }).click();
  expect((await stored(page)).profile.safety.level).toBe('high');
});
