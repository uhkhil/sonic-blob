import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const screenshotsDir = path.join(process.cwd(), 'screenshots');

  for (let i = 1; i <= 5; i++) {
    const filePath = path.join(process.cwd(), 'screenshots', `slide-${i}.html`);
    const fileUrl = `file://${filePath}`;

    console.log(`Capturing Slide ${i}: ${fileUrl}`);

    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto(fileUrl);
    // Wait for everything to load (including fonts/scripts)
    await page.waitForLoadState('networkidle');

    const element = await page.$('.slide-canvas');
    if (element) {
      const outputPath = path.join(screenshotsDir, `slide-${i}.png`);
      await element.screenshot({ path: outputPath });
      console.log(`Saved: ${outputPath}`);
    } else {
      console.error(`Error: .slide-canvas not found on Slide ${i}`);
    }
  }

  await browser.close();
  console.log('Capture complete!');
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
