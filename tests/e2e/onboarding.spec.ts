import { expect, test } from '@playwright/test';
import { freshApp, onboard, stored } from './helpers';

test('low-risk onboarding lands on Day 1 with personalised content', async ({ page }) => {
  await freshApp(page);
  await expect(page.getByRole('heading', { name: 'Tidewise' })).toBeVisible();
  await onboard(page);
  await expect(page.getByRole('heading', { name: /Good evening, Jo/ })).toBeVisible();
  await expect(page.getByTestId('streak')).toHaveText('1');
  await expect(page.getByText('day alcohol-free')).toBeVisible();
  // Tool of the day is matched to the chosen drinking jobs
  await expect(page.getByText(/Tool for today · (Unwind after stress|Get to sleep)/)).toBeVisible();
  const d = await stored(page);
  expect(d.profile.motives).toEqual(['stress', 'sleep']);
  expect(d.profile.audit.score).toBe(0);
  expect(d.profile.safety.level).toBe('low');
  expect(d.profile.reasons).toEqual(['Better sleep', 'Be there for my kids']);
  expect(d.contacts[0]).toMatchObject({ name: 'Sam', phone: '+1 (555) 010-0123' });
});

async function toAudit(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /begin/i }).click();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Next|Skip/ }).click();
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled(); // baseline is required
  await page.getByRole('spinbutton', { name: 'Drinking days in a typical week' }).fill('2');
  await page.getByRole('spinbutton', { name: /Standard drinks on a typical drinking day/ }).fill('3');
  await page.getByRole('button', { name: 'Next' }).click();
}

test('high-risk drinkers default to medical support and must confirm a doctor to go it alone', async ({ page }) => {
  await freshApp(page);
  await toAudit(page);
  await page.getByRole('button', { name: 'Skip this' }).click(); // AUDIT skipped
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled(); // safety must be answered
  for (const r of await page.getByRole('radio', { name: 'No', exact: true }).all()) await r.click();
  await page.getByRole('radiogroup', { name: /seizure/ }).getByRole('radio', { name: 'Yes' }).click();
  await expect(page.getByTestId('risk-high')).toContainText('Please don’t stop suddenly on your own');
  await expect(page.getByTestId('risk-high')).toContainText('don’t suddenly stop or sharply cut down');
  await expect(page.getByTestId('risk-high').getByRole('link', { name: /Call SAMHSA/ })).toHaveAttribute('href', 'tel:18006624357');
  await page.getByRole('button', { name: 'Next' }).click();

  const medical = page.getByRole('radio', { name: /Stop with medical support/ });
  await expect(medical).toContainText('Recommended for you');
  await expect(medical).toHaveAttribute('aria-checked', 'true'); // default for high risk
  await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();

  await page.getByRole('radio', { name: /Stop on a set day/ }).click();
  await expect(page.getByTestId('gate-high')).toContainText('could cause seizures or severe withdrawal');
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

  await page.getByRole('radio', { name: /Step down to zero/ }).click();
  await expect(page.getByText('With your risk level, reducing on your own isn’t safe.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  await page.getByText('A doctor is guiding my step-down plan').click();
  await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
});

test('daily drinking + morning drinking on AUDIT is rated high risk even if “no withdrawal”', async ({ page }) => {
  await freshApp(page);
  await toAudit(page);
  const groups = page.locator('.audit-options');
  for (let i = 0; i < 10; i++) await groups.nth(i).getByRole('radio').nth(i === 5 ? 2 : 0).click(); // item 6: “Monthly”
  await page.getByRole('button', { name: 'Next' }).click();
  for (const r of await page.getByRole('radio', { name: 'No', exact: true }).all()) await r.click();
  await page.getByRole('radiogroup', { name: /every day/ }).getByRole('radio', { name: 'Yes' }).click();
  await expect(page.getByTestId('risk-high')).toContainText('need a drink in the morning');
});

test('AUDIT scoring shows zone and score', async ({ page }) => {
  await freshApp(page);
  await toAudit(page);
  const groups = page.locator('.audit-options');
  for (let i = 0; i < 10; i++) await groups.nth(i).getByRole('radio').last().click();
  await expect(page.getByText('Possible dependence')).toBeVisible();
  await expect(page.locator('.big-score')).toContainText('40');
});

test('drink counter adds up several kinds of drink', async ({ page }) => {
  await freshApp(page);
  await page.getByRole('button', { name: /begin/i }).click();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Next|Skip/ }).click();
  await page.getByRole('button', { name: /Help me count/ }).click();
  await page.getByLabel('What do you drink?').selectOption('wine-glass');
  await page.getByRole('spinbutton', { name: 'How many?' }).fill('2');
  await page.getByRole('button', { name: /^Add 2/ }).click(); // 2 × 1.1 = 2 (rounded to .5)
  await page.getByLabel('What do you drink?').selectOption('beer-can');
  await page.getByRole('spinbutton', { name: 'How many?' }).fill('3');
  await page.getByRole('button', { name: /^Add 3/ }).click();
  await expect(page.getByRole('spinbutton', { name: /Standard drinks on a typical drinking day/ })).toHaveValue('5');
});

test('future quit date shows countdown and a persistent prep checklist', async ({ page }) => {
  await freshApp(page);
  await onboard(page, { quitInDays: 3 });
  await expect(page.getByTestId('countdown')).toHaveText('3');
  const item = page.getByText('Clear alcohol out of your home');
  await item.click();
  await page.reload();
  await expect(page.locator('.toggle input').first()).toBeChecked();
});

test('step-down plan shows today’s limit', async ({ page }) => {
  await freshApp(page);
  await onboard(page, { approach: 'Step down to zero', quitInDays: 14 });
  await expect(page.getByTestId('taper-card')).toContainText('Today’s limit: 3');
});
