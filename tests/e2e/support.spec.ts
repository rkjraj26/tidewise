import { expect, test } from '@playwright/test';
import { seededApp, stored } from './helpers';

test('support: emergency + helplines + contacts with call/text links', async ({ page }) => {
  await seededApp(page, '#/support');
  await expect(page.getByRole('link', { name: 'Call 911' })).toHaveAttribute('href', 'tel:911');
  await expect(page.getByRole('link', { name: 'Call 988' })).toHaveAttribute('href', 'tel:988');
  await expect(page.getByRole('link', { name: 'Call 1-800-662-4357' })).toHaveAttribute('href', 'tel:18006624357');

  await page.getByText('Add a person').click();
  await page.getByLabel('Name', { exact: true }).fill('Priya');
  await page.getByLabel('Phone').fill('+44 7700 900123');
  await page.getByRole('button', { name: 'Save person' }).click();
  await expect(page.getByRole('link', { name: 'Call Priya' })).toHaveAttribute('href', 'tel:+447700900123');
  const sms = await page.getByRole('link', { name: 'Text Priya' }).getAttribute('href');
  expect(sms).toMatch(/^sms:\+447700900123\?body=/);
  expect(decodeURIComponent(sms!.split('body=')[1])).toContain('tough craving');
  await page.getByRole('button', { name: 'Remove Sam' }).click();
  expect((await stored(page)).contacts.map((c: any) => c.name)).toEqual(['Priya']);
});

test('changing region swaps helplines, emergency number and drink units', async ({ page }) => {
  await seededApp(page, '#/settings');
  await page.getByLabel('Country / region').selectOption('UK');
  await page.goto('/#/support');
  await expect(page.getByRole('link', { name: 'Call 999' })).toHaveAttribute('href', 'tel:999');
  await expect(page.getByRole('heading', { name: 'Drinkline (England)' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Call 116 123' })).toBeVisible();
  await page.goto('/');
  await expect(page.getByText('units not drunk')).toBeVisible();

  await page.goto('/#/settings');
  await page.getByLabel('Country / region').selectOption('IN');
  await page.goto('/#/support');
  await expect(page.getByRole('link', { name: 'Call 112' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Call 14416' })).toHaveAttribute('href', 'tel:14416');
  await expect(page.getByRole('link', { name: 'Call 14446' })).toBeVisible();
});

test('doctor prep sheet contains the clinical summary and can be copied', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await seededApp(page, '#/support/doctor');
  const r = page.getByTestId('doctor-report');
  await expect(r).toContainText('AUDIT score: 18/40 (Higher risk)');
  await expect(r).toContainText('MODERATE risk');
  await expect(r).toContainText('Drinks daily or almost daily');
  await expect(r).toContainText('Days with no drinking logged: 22 of 23');
  await expect(r).toContainText('Last drinking day logged: Wed, October 21');
  await expect(r).toContainText('naltrexone or acamprosate');
  await page.getByRole('button', { name: 'Copy' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied to clipboard.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('AUDIT score: 18/40');
});

test('“Other country” users can set their own emergency number, used everywhere', async ({ page }) => {
  await seededApp(page, '#/settings');
  await page.getByLabel('Country / region').selectOption('OTHER');
  await page.getByLabel('Local emergency number').fill('119');
  await page.goto('/#/support');
  await expect(page.getByRole('link', { name: 'Call 119' })).toHaveAttribute('href', 'tel:119');
  await expect(page.getByRole('link', { name: /Find A Helpline|Website/ }).first()).toBeVisible();
  await page.goto('/#/withdrawal');
  await page.getByText('A fall or blow to the head').click();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByTestId('wd-emergency').getByRole('link', { name: 'Call 119' })).toBeVisible();
});
