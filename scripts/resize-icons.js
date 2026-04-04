import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const sizes = [16, 24, 32, 48, 128];
const inputPath = path.join(process.cwd(), 'public', 'logo.png');
const outputDir = path.join(process.cwd(), 'public', 'icons');

async function resize() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Resizing ${inputPath}...`);

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `${size}.png`);
    await sharp(inputPath).resize(size, size).toFile(outputPath);
    console.log(`Generated: ${outputPath}`);
  }

  console.log('Icon generation complete!');
}

resize().catch((err) => {
  console.error('Resize failed:', err);
  process.exit(1);
});
