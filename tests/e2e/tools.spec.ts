import { expect, test } from '@playwright/test';
import { seededApp, stored } from './helpers';

test('toolkit: why-tools are personalised; plans, thoughts and balance persist', async ({ page }) => {
  await seededApp(page, '#/tools');
  await page.getByRole('link', { name: /Tools for why you drink/ }).click();
  await expect(page.locator('.card .eyebrow')).toHaveText(['Unwind after stress', 'Get to sleep', 'Calm anxiety or nerves']);
  await page.getByRole('radio', { name: 'All' }).click();
  await expect(page.locator('.card .eyebrow')).toHaveCount(13);

  await page.goto('/#/tools/plans');
  await page.getByLabel('If…').fill('my brother opens a beer');
  await page.getByLabel('Then I will…').fill('get a ginger beer and step outside');
  await page.getByRole('button', { name: 'Add plan' }).click();
  await page.getByRole('button', { name: /Use plan: Someone offers me a drink/ }).click();
  await page.reload();
  await expect(page.getByTestId('plan-list')).toContainText('my brother opens a beer');
  await expect(page.getByTestId('plan-list')).toContainText('Someone offers me a drink');
  await page.getByTestId('plan-list').getByRole('button', { name: 'Delete plan' }).first().click();
  await expect(page.getByTestId('plan-list').locator('li')).toHaveCount(2);

  await page.goto('/#/tools/thoughts');
  await expect(page.getByText('“Just one won’t hurt.”')).toBeVisible();
  await page.getByLabel('The thought').fill('One glass at the wedding is fine');
  await page.getByLabel('Which trap is it?').selectOption('permission');
  await page.getByLabel('A more helpful, honest response').fill('I can toast with sparkling water and remember the whole night.');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('“One glass at the wedding is fine”')).toBeVisible();

  await page.goto('/#/tools/balance');
  await page.getByLabel('What I get from drinking').fill('Relief after work');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved.');
  const d = await stored(page);
  expect(d.thoughts[0].trapId).toBe('permission');
  expect(d.decisional.drinkingGood).toBe('Relief after work');
});

test('grounding, HALT, breathing and refusal tools work', async ({ page }) => {
  await seededApp(page, '#/tools/ground');
  for (const n of [5, 4, 3, 2, 1]) {
    await expect(page.locator('.ground-text')).toContainText(`Name ${n}`);
    await page.getByRole('button', { name: 'Done — next' }).click();
  }
  await expect(page.getByText('Well done.')).toBeVisible();

  await page.goto('/#/tools/halt');
  await page.getByRole('button', { name: 'Hungry' }).click();
  await expect(page.getByText(/low blood sugar feels a lot like a craving/)).toBeVisible();

  await page.goto('/#/tools/breathe');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByText('Breathe in…')).toBeVisible();
  await page.clock.runFor(5000);
  await expect(page.getByText('Breathe out slowly…')).toBeVisible();
  await page.getByRole('button', { name: 'Stop' }).click();

  await page.goto('/#/tools/refuse');
  await expect(page.getByText('“No thanks, I’m not drinking.”')).toBeVisible();
});

test('learn library: all lessons open', async ({ page }) => {
  await seededApp(page, '#/learn');
  const links = page.locator('a.navcard');
  const n = await links.count();
  expect(n).toBe(10);
  for (let i = 0; i < n; i++) {
    await page.goto('/#/learn');
    await links.nth(i).click();
    await expect(page.getByText('Key takeaway')).toBeVisible();
  }
});
