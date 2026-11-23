// Rend les études 3D (visuels de démonstration) en WebP dans public/stills/.
// Usage : npm run render:stills  (nécessite Playwright + Chromium, et python3 avec Pillow)
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const tmp = resolve(root, '.stills-tmp');
const out = resolve(root, 'public/stills');
mkdirSync(tmp, { recursive: true });
mkdirSync(out, { recursive: true });

const server = await createServer({ root, server: { port: 5199 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1300, height: 1100 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto('http://localhost:5199/stills.html');
await page.waitForFunction(() => typeof window.__render === 'function');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : await page.evaluate(() => window.__variants.map((v) => v.id));
for (const id of ids) {
  await page.evaluate((i) => window.__render(i), id);
  const png = resolve(tmp, `${id}.png`);
  await page.locator('#c').screenshot({ path: png });
  console.log('rendu', id);
}
await browser.close();
await server.close();

// Conversion WebP (2 largeurs) via Pillow.
execFileSync('python3', ['-I', '-c', `
import sys, os
from PIL import Image
tmp, out = sys.argv[1], sys.argv[2]
for f in sorted(os.listdir(tmp)):
    if not f.endswith('.png'): continue
    im = Image.open(os.path.join(tmp, f)).convert('RGB')
    base = f[:-4]
    for w in (1600, 800):
        r = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        r.save(os.path.join(out, f'{base}-{w}.webp'), 'WEBP', quality=80, method=6)
    print('webp', base, im.size)
`, tmp, out], { stdio: 'inherit' });
rmSync(tmp, { recursive: true, force: true });
