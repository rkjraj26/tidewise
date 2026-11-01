import { expect, test } from '@playwright/test';
import { seededApp, stored } from './helpers';

test('ride the wave: rate, breathe, timer completes, re-rate, logged and reflected in Progress', async ({ page }) => {
  await seededApp(page);
  await page.getByRole('link', { name: 'SOS: ride the wave' }).click();
  const start = page.getByRole('button', { name: 'Start riding the wave' });
  await expect(start).toBeDisabled();
  await page.getByRole('radio', { name: '8 out of 10' }).click();
  await page.getByRole('button', { name: 'Stress' }).click();
  await start.click();
  await expect(page.getByTestId('timer')).toHaveText(/^(10:00|09:5\d)$/);
  await expect(page.getByText(/Breathe (in|out)/)).toBeVisible();
  // Tools inside the timer
  await page.getByRole('tab', { name: 'Play it forward' }).click();
  await expect(page.getByText('Tomorrow morning.')).toBeVisible();
  await page.getByRole('tab', { name: 'Reach out' }).click();
  await expect(page.getByRole('link', { name: /Text/ })).toHaveAttribute('href', /^sms:\+15550100\?body=/);
  // Time passes — the timer ends by itself
  await page.clock.fastForward('10:05');
  await expect(page.getByText('Time’s up — the wave has passed its peak.')).toBeVisible();
  await page.getByRole('radio', { name: '3 out of 10' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('sos-done')).toHaveText('From 8 down to 3. You rode the wave.');

  const d = await stored(page);
  const last = d.urges[d.urges.length - 1];
  expect(last).toMatchObject({ before: 8, after: 3, outcome: 'rode', triggers: ['stress'] });
  expect(last.durationSec).toBeGreaterThanOrEqual(600);

  await page.goto('/#/progress');
  await expect(page.getByText('cravings ridden out')).toBeVisible();
  await expect(page.locator('.stat', { hasText: 'cravings ridden out' }).locator('.stat-value')).toHaveText('6');
  await expect(page.getByTestId('urge-drop')).toBeVisible();
});

test('“I’m through it” ends early; “I drank” goes to the compassionate slip flow', async ({ page }) => {
  await seededApp(page, '#/sos');
  await page.getByRole('radio', { name: '6 out of 10' }).click();
  await page.getByRole('button', { name: 'Start riding the wave' }).click();
  await page.getByRole('button', { name: 'I drank' }).click();
  await expect(page.getByRole('heading', { name: 'Thank you for being honest' })).toBeVisible();
  await expect(page.getByText('Your progress is safe:')).toBeVisible();
  const d = await stored(page);
  expect(d.urges[d.urges.length - 1].outcome).toBe('drank');
});

test('still-strong craving offers another wave', async ({ page }) => {
  await seededApp(page, '#/sos');
  await page.getByRole('radio', { name: '9 out of 10' }).click();
  await page.getByRole('button', { name: 'Start riding the wave' }).click();
  await page.getByRole('button', { name: 'I’m through it' }).click();
  await page.getByRole('radio', { name: '7 out of 10' }).click();
  await page.getByRole('button', { name: 'Ride another wave' }).click();
  await expect(page.getByTestId('timer')).toBeVisible();
  const d = await stored(page);
  expect(d.urges.length).toBe(7);
});

test('“Shaky / unwell” trigger points to the withdrawal check', async ({ page }) => {
  await seededApp(page, '#/sos');
  await page.getByRole('button', { name: 'Shaky / unwell' }).click();
  await expect(page.getByTestId('sos-withdrawal')).toContainText('may be withdrawal');
  await page.getByTestId('sos-withdrawal').getByRole('link', { name: 'Check my symptoms' }).click();
  await expect(page.getByRole('heading', { name: 'Withdrawal monitor' })).toBeVisible();
});
