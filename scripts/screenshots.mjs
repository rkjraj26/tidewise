// Capture every screen with realistic data, for design review + the README.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { seed } from '../tests/fixtures/seed.mjs';

const base = process.env.BASE ?? 'http://localhost:4173/';
const out = process.argv[2] ?? 'docs/screenshots';
const scheme = process.argv[3] ?? 'light';
const scale = Number(process.argv[4] ?? 2);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: scale, colorScheme: scheme, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

// Onboarding first screens (fresh state)
await page.goto(base);
await page.screenshot({ path: `${out}/01-welcome-${scheme}.png` });
await page.getByRole('button', { name: /begin/i }).click();
await page.getByRole('button', { name: 'Next' }).click();
for (const m of ['Unwind after stress', 'Get to sleep', 'Calm anxiety or nerves']) await page.getByRole('button', { name: m }).click();
await page.screenshot({ path: `${out}/02-motives-${scheme}.png` });
await page.getByRole('button', { name: 'Next' }).click();
await page.screenshot({ path: `${out}/03-honest-deal-${scheme}.png`, fullPage: true });

// Seeded journey
await page.evaluate((d) => localStorage.setItem('tidewise:v1', JSON.stringify(d)), seed());
const shots = [
  ['04-home', '#/'],
  ['05-progress', '#/progress'],
  ['06-sos', '#/sos'],
  ['08-toolkit', '#/tools'],
  ['09-why-tools', '#/tools/why'],
  ['10-thoughts', '#/tools/thoughts'],
  ['11-support', '#/support'],
  ['12-doctor', '#/support/doctor'],
  ['13-withdrawal', '#/withdrawal'],
  ['14-checkin', '#/checkin'],
  ['15-lesson-meds', '#/learn/meds'],
  ['16-settings', '#/settings'],
];
for (const [name, hash] of shots) {
  await page.goto(base + hash);
  await page.reload();
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${out}/${name}-${scheme}.png`, fullPage: true });
}
// SOS riding state
await page.goto(base + '#/sos');
await page.getByRole('radio', { name: '8 out of 10' }).click();
await page.getByRole('button', { name: 'Stress' }).click();
await page.getByRole('button', { name: 'Start riding the wave' }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/07-sos-riding-${scheme}.png`, fullPage: true });

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no console errors');
await browser.close();
