import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { freshApp, seededApp } from './helpers';

/** A tiny static server we can switch off, to simulate genuinely losing the network. */
async function startServer(port: number) {
  const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
  const server = http.createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    try {
      const body = await readFile(join('dist', normalize(p)));
      res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((r) => server.listen(port, r));
  return () => new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); });
}

test('works offline after first visit (service worker), with data intact', async ({ page }) => {
  const stop = await startServer(4180);
  await page.goto('http://localhost:4180/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
  });
  await page.evaluate(() => localStorage.setItem('tidewise:test', 'kept'));
  await stop(); // the network is now gone
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Tidewise' })).toBeVisible();
  await page.getByRole('button', { name: /begin/i }).click();
  await expect(page.getByRole('heading', { name: 'First, a little about you' })).toBeVisible();
  await page.reload(); // a second cold start, still offline
  await expect(page.getByRole('heading', { name: 'Tidewise' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('tidewise:test'))).toBe('kept');
});

test('manifest and icons are valid', async ({ request }) => {
  const m = await (await request.get('/manifest.webmanifest')).json();
  expect(m.short_name).toBe('Tidewise');
  expect(m.display).toBe('standalone');
  for (const icon of m.icons) expect((await request.get('/' + icon.src)).status()).toBe(200);
});

test('makes no network requests to other origins', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost:4173')) external.push(r.url());
  });
  await seededApp(page);
  for (const h of ['#/progress', '#/tools', '#/support', '#/support/doctor', '#/learn/meds', '#/settings']) await page.goto('/' + h);
  expect(external).toEqual([]);
});

const SCREENS = ['#/', '#/progress', '#/sos', '#/tools', '#/tools/why', '#/tools/thoughts', '#/tools/plans', '#/support', '#/support/doctor', '#/withdrawal', '#/checkin', '#/settings', '#/learn', '#/learn/withdrawal', '#/screening'];

for (const scheme of ['light', 'dark'] as const) {
  test(`accessibility: no serious WCAG 2.1 AA violations (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    const problems: string[] = [];
    const scan = async (where: string) => {
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      for (const v of r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
        problems.push(`${where}: ${v.id} — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    };
    await freshApp(page);
    await scan('welcome');
    await page.getByRole('button', { name: /begin/i }).click();
    await scan('onboarding/you');
    await seededApp(page);
    for (const h of SCREENS) {
      await page.goto('/' + h);
      await page.waitForTimeout(50);
      await scan(h);
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
}

test('if the browser blocks storage, the app still works and says data will not be saved', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  });
  await page.goto('/');
  await expect(page.getByRole('status').filter({ hasText: 'blocking storage' })).toBeVisible();
  await page.getByRole('button', { name: /begin/i }).click();
  await expect(page.getByRole('heading', { name: 'First, a little about you' })).toBeVisible();
});
