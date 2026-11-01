import { expect, test } from '@playwright/test';
import { seededApp, stored } from './helpers';

test.describe('withdrawal monitor triage', () => {
  test('red flag → emergency with call button', async ({ page }) => {
    await seededApp(page, '#/withdrawal');
    await page.getByText('Seeing, hearing or feeling things that aren’t there').click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByTestId('wd-emergency')).toContainText('This is an emergency — call now');
    await expect(page.getByTestId('wd-emergency').getByRole('link', { name: 'Call 911' })).toHaveAttribute('href', 'tel:911');
    expect((await stored(page)).withdrawal[0]).toMatchObject({ level: 'emergency', redFlags: ['hallucinations'] });
  });
  test('suicidal thoughts → crisis line', async ({ page }) => {
    await seededApp(page, '#/withdrawal');
    await page.getByText('Thoughts of harming yourself or ending your life').click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByTestId('wd-crisis').getByRole('link', { name: /Call 988 Suicide/ })).toHaveAttribute('href', 'tel:988');
  });
  test('3 symptoms → call a doctor today', async ({ page }) => {
    await seededApp(page, '#/withdrawal');
    for (const s of ['Shaky hands or body', 'Sweating, especially at night', 'Headache']) await page.getByText(s).click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByTestId('wd-urgent')).toContainText('Call a doctor or helpline today');
  });
  test('seizure + suicidal thoughts → both the emergency and the crisis card', async ({ page }) => {
    await seededApp(page, '#/withdrawal');
    await page.getByText('A seizure (fit), or passing out').click();
    await page.getByText('Thoughts of harming yourself or ending your life').click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByTestId('wd-emergency')).toBeVisible();
    await expect(page.getByTestId('wd-crisis')).toContainText('put distance between you and alcohol');
  });
  test('high-risk person with one symptom → urgent, with the region’s medical line', async ({ page }) => {
    await seededApp(page, '#/withdrawal', (d) => {
      d.profile.region = 'UK';
      d.profile.safety.level = 'high';
    });
    await page.getByText('Headache').click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByTestId('wd-urgent').getByRole('link', { name: 'Call NHS 111' })).toHaveAttribute('href', 'tel:111');
  });
  test('1 mild symptom → self-care', async ({ page }) => {
    await seededApp(page, '#/withdrawal');
    await page.getByText('Headache').click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByTestId('wd-selfcare')).toBeVisible();
  });
  test('home shows withdrawal card in first week for moderate risk', async ({ page }) => {
    const d = new Date(2026, 9, 30);
    d.setDate(d.getDate() - 2);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await seededApp(page, '#/', (data) => {
      data.profile.plan.quitDate = k;
    });
    await expect(page.getByRole('link', { name: 'Check my symptoms' })).toBeVisible();
  });
});
