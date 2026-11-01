import type { Page } from '@playwright/test';
// @ts-ignore — plain ESM fixture shared with the screenshot script
import { seed } from '../fixtures/seed.mjs';

/** Friday 30 Oct 2026, 19:30 local time — a classic high-risk evening. */
export const NOW = new Date(2026, 9, 30, 19, 30, 0);

export async function freshApp(page: Page, now: Date = NOW) {
  await page.clock.install({ time: now });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

export async function seededApp(page: Page, hash = '#/', mutate?: (d: any) => void, now: Date = NOW) {
  await page.clock.install({ time: now });
  const data = seed(now);
  mutate?.(data);
  await page.goto('/');
  await page.evaluate((d) => localStorage.setItem('tidewise:v1', JSON.stringify(d)), data);
  await page.goto('/' + hash);
  await page.reload();
  return data;
}

export async function stored(page: Page): Promise<any> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('tidewise:v1') || 'null'));
}

/** Walk the onboarding. Options choose the risk profile. */
export async function onboard(
  page: Page,
  opts: { name?: string; risky?: 'none' | 'seizure'; approach?: 'Stop on a set day' | 'Stop with medical support' | 'Step down to zero'; quitInDays?: number; contact?: boolean } = {},
) {
  const { name = 'Jo', risky = 'none', approach = 'Stop on a set day', quitInDays = 0, contact = true } = opts;
  await page.getByRole('button', { name: /begin/i }).click();
  await page.getByLabel(/What should we call you/).fill(name);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Unwind after stress' }).click();
  await page.getByRole('button', { name: 'Get to sleep' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('heading', { name: 'Here’s the honest deal' }).waitFor();
  await page.getByRole('button', { name: 'Next' }).click();
  // baseline
  await page.getByRole('spinbutton', { name: 'Drinking days in a typical week' }).fill('3');
  await page.getByRole('spinbutton', { name: /Standard drinks on a typical drinking day/ }).fill('3');
  await page.getByRole('button', { name: 'Next' }).click();
  // AUDIT: answer every question with its first option
  const groups = page.locator('.audit-options');
  for (let i = 0; i < 10; i++) await groups.nth(i).getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Next' }).click();
  // Safety
  for (const r of await page.getByRole('radio', { name: 'No', exact: true }).all()) await r.click();
  if (risky === 'seizure') {
    await page.getByRole('radiogroup', { name: /seizure/ }).getByRole('radio', { name: 'Yes' }).click();
  }
  await page.getByRole('button', { name: 'Next' }).click();
  // Plan
  await page.getByRole('radio', { name: new RegExp(approach) }).click();
  if (quitInDays) {
    const d = new Date(NOW);
    d.setDate(d.getDate() + quitInDays);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await page.getByLabel(/quit day|zero day/i).fill(k);
  }
  await page.getByRole('button', { name: 'Next' }).click();
  // Reasons
  await page.getByRole('button', { name: 'Better sleep' }).click();
  await page.getByLabel('In your own words').fill('Be there for my kids');
  await page.getByRole('button', { name: 'Next' }).click();
  if (contact) {
    await page.getByLabel('Their name').fill('Sam');
    await page.getByLabel('Their phone number').fill('+1 (555) 010-0123');
  }
  await page.getByRole('button', { name: 'Start my plan' }).click();
}
