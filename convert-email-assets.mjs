import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'public', 'email-assets');

const files = [
  { name: 'icon', width: 84, height: 84 },
  { name: 'signed_up', width: 640, height: 440 },
  { name: 'personal_info', width: 640, height: 440 },
  { name: 'kyc', width: 640, height: 440 },
  { name: 'paid', width: 640, height: 440 },
  { name: 'free_upgrade', width: 640, height: 440 },
];

for (const f of files) {
  const input = path.join(dir, `${f.name}.svg`);
  const output = path.join(dir, `${f.name}.png`);
  await sharp(input, { density: 300 })
    .resize(f.width, f.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(output);
  console.log(`✓ ${f.name}.svg → ${f.name}.png (${f.width}×${f.height})`);
}
