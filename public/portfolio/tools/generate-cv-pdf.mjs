import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const CV_HTML = path.join(ROOT, 'cv.html');
const OUT_DIR = path.join(ROOT, 'assets', 'cv');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function renderPdf({ lang, outFile }) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  // Force language + light theme before any page script runs
  await page.addInitScript((l) => {
    try {
      localStorage.setItem('portfolio_lang', l);
      localStorage.setItem('portfolio_theme', 'light');
    } catch (_) {}
  }, lang);

  const url = pathToFileURL(CV_HTML).toString() + `?print=1&lang=${encodeURIComponent(lang)}`;
  await page.goto(url, { waitUntil: 'load' });

  // Wait until CV content is hydrated
  await page.waitForFunction(() => {
    const name = document.querySelector('#cv-name');
    const items = document.querySelectorAll('.cv-timeline-item');
    return !!name && (name.textContent || '').trim().length > 0 && items.length > 0;
  }, { timeout: 15000 });

  // Use print CSS
  await page.emulateMedia({ media: 'print' });

  await page.pdf({
    path: outFile,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
  });

  await browser.close();
}

async function main() {
  await ensureDir(OUT_DIR);

  const outIT = path.join(OUT_DIR, 'Manuel_Zambelli_CV_IT.pdf');
  const outEN = path.join(OUT_DIR, 'Manuel_Zambelli_CV_EN.pdf');
  const outDefault = path.join(OUT_DIR, 'Manuel_Zambelli_CV.pdf');

  await renderPdf({ lang: 'it', outFile: outIT });
  await renderPdf({ lang: 'en', outFile: outEN });

  // Default = IT
  await fs.copyFile(outIT, outDefault);

  console.log('✅ CV PDFs generated:', path.relative(ROOT, outIT), path.relative(ROOT, outEN));
}

main().catch((err) => {
  console.error('❌ Failed to generate CV PDF:', err);
  process.exit(1);
});
