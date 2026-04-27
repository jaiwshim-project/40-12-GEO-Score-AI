// URGENCY CTA 섹션 단독 스크린샷
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const candidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const exec = candidates.find(p => fs.existsSync(p));
if (!exec) { console.error('Chrome/Edge not found'); process.exit(1); }

(async () => {
  const browser = await puppeteer.launch({ executablePath: exec, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:8765/', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 600));

  // URGENCY CTA 섹션 (h2 텍스트로 찾기)
  const handle = await page.evaluateHandle(() => {
    const h2s = [...document.querySelectorAll('h2')];
    for (const h of h2s) {
      if (h.textContent.includes('AI 인용') && h.textContent.includes('잃습니다')) {
        return h.closest('section');
      }
    }
    return null;
  });
  const el = handle.asElement();
  if (!el) { console.error('CTA 섹션 못 찾음'); await browser.close(); process.exit(1); }

  await el.scrollIntoView();
  await new Promise(r => setTimeout(r, 200));

  const out = 'cta-preview.png';
  await el.screenshot({ path: out });
  await browser.close();
  console.log('saved:', out);
})();
