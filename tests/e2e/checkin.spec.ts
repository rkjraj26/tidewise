import { expect, test } from '@playwright/test';
import { seededApp, stored } from './helpers';

test('seeded stats are computed correctly on Home', async ({ page }) => {
  await seededApp(page);
  await expect(page.getByTestId('streak')).toHaveText('9');
  await expect(page.getByTestId('hero-sub')).toHaveText('22 alcohol-free days in total · longest run 13');
  // 23 days × $90/7 − 4 drinks × $3  = $283.7 ; 23 × 30/7 − 4 = 94.6 drinks
  await expect(page.locator('.stat', { hasText: 'saved' }).locator('.stat-value')).toHaveText('$284');
  await expect(page.locator('.stat', { hasText: 'not drunk' }).locator('.stat-value')).toHaveText('95');
  await expect(page.getByText(/riskiest time looks like Fridays|riskiest time looks like/)).toBeVisible();
});

test('quick alcohol-free log', async ({ page }) => {
  await seededApp(page);
  await page.getByRole('button', { name: 'Alcohol-free so far' }).click();
  await expect(page.getByTestId('today-status')).toContainText('Logged as alcohol-free');
  const d = await stored(page);
  expect(d.days['2026-10-30']).toMatchObject({ drank: false, drinks: 0 });
});

test('logging a drink: debrief → if-then plan; progress kept, run resets', async ({ page }) => {
  await seededApp(page, '#/checkin');
  await page.getByRole('radio', { name: 'Yes', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'How many standard drinks?' }).fill('3');
  await page.getByRole('radio', { name: 'Low' }).click();
  await page.getByRole('radio', { name: '9 out of 10' }).click();
  await page.getByRole('button', { name: 'Lonely' }).click();
  await page.getByRole('button', { name: 'Save check-in' }).click();

  await expect(page.getByRole('heading', { name: 'Thank you for being honest' })).toBeVisible();
  await page.getByRole('button', { name: 'Let’s learn from it' }).click();
  await page.getByLabel('Where were you, and what was going on?').fill('Friday night alone after a long week');
  await page.getByRole('button', { name: 'Stress' }).click();
  await page.getByLabel('What did you tell yourself?').fill('I deserve it');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Next time, I will…').fill('Book Friday dinner with Sam in advance');
  await page.getByRole('button', { name: 'Save and move on' }).click();
  await expect(page.getByTestId('slip-plan')).toBeVisible();
  await page.getByRole('button', { name: 'Back to home' }).click();

  await expect(page.getByTestId('streak')).toHaveText('0');
  await expect(page.getByText('Today is a fresh start')).toBeVisible();
  await expect(page.getByTestId('hero-sub')).toHaveText('21 alcohol-free days in total · longest run 13');

  const d = await stored(page);
  expect(d.days['2026-10-30']).toMatchObject({ drank: true, drinks: 3, mood: 2, craving: 9, halt: ['lonely'] });
  expect(d.lapses).toHaveLength(2);
  expect(d.plans[d.plans.length - 1]).toMatchObject({ ifText: 'Friday night alone after a long week', thenText: 'Book Friday dinner with Sam in advance' });

  await page.goto('/#/tools/plans');
  await expect(page.getByTestId('plan-list')).toContainText('Book Friday dinner with Sam in advance');
});

test('slip logged from Home adds drinks for the chosen day', async ({ page }) => {
  await seededApp(page);
  await page.getByRole('link', { name: 'I had a drink' }).click();
  await page.getByRole('button', { name: 'Let’s learn from it' }).click();
  await page.getByRole('radio', { name: 'Yesterday' }).click();
  await page.getByRole('spinbutton', { name: 'Standard drinks' }).fill('2');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Save and move on' }).click();
  const d = await stored(page);
  expect(d.days['2026-10-29']).toMatchObject({ drank: true, drinks: 2 });
  await page.getByRole('button', { name: 'Back to home' }).click();
  await expect(page.getByTestId('streak')).toHaveText('1');
});

test('editing yesterday’s check-in', async ({ page }) => {
  await seededApp(page, '#/checkin');
  await page.getByRole('radio', { name: 'Yesterday' }).click();
  await expect(page.getByRole('heading', { name: /Did you drink on/ })).toBeVisible();
  await page.getByRole('radio', { name: 'No — alcohol-free' }).click();
  await page.getByRole('radio', { name: 'Great' }).first().click();
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.getByText('Saved. Thank you for checking in.')).toBeVisible();
  const d = await stored(page);
  expect(d.days['2026-10-29']).toMatchObject({ drank: false, mood: 5 });
});

test('an “Awful” mood check-in offers crisis support', async ({ page }) => {
  await seededApp(page, '#/checkin');
  await page.getByRole('radio', { name: 'No — alcohol-free' }).click();
  await page.getByRole('radio', { name: 'Awful' }).click();
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.getByTestId('mood-support').getByRole('link', { name: /Call 988/ })).toHaveAttribute('href', 'tel:988');
});

test('several drinking days in a row → withdrawal warning after a slip and a week of withdrawal checks', async ({ page }) => {
  await seededApp(page, '#/', (d) => {
    for (const k of ['2026-10-28', '2026-10-29']) d.days[k] = { date: k, drank: true, drinks: 4, updatedAt: '' };
    d.profile.safety.level = 'low';
  });
  await page.getByRole('link', { name: 'I had a drink' }).click();
  await page.getByRole('button', { name: 'Let’s learn from it' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Save and move on' }).click();
  await expect(page.getByTestId('slip-withdrawal')).toBeVisible();
  await page.getByRole('button', { name: 'Back to home' }).click();
  await expect(page.getByRole('link', { name: 'Check my symptoms' })).toBeVisible();
});

test('step-down: hold this step pushes the zero day back', async ({ page }) => {
  await seededApp(page, '#/', (d) => {
    d.profile.safety.level = 'moderate';
    d.profile.plan = { approach: 'stepdown', startedOn: '2026-10-20', quitDate: '2026-11-10', medicalGuidance: false };
    d.days = {};
    d.lapses = [];
  });
  await expect(page.getByTestId('taper-card')).toContainText('Today’s limit:');
  await page.getByText('Shaky, sweaty, sick or very anxious?').click();
  await page.getByRole('button', { name: /Hold this step/ }).click();
  const st = await stored(page);
  expect(st.profile.plan).toMatchObject({ quitDate: '2026-11-14', holdDays: 4 });
});
