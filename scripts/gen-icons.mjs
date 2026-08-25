import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Source priority: your real artwork (drop it here) > the vector fallback.
const REAL = 'public/branding/turf-gilt.png';
const SVG = 'public/branding/icon.svg';
const source = fs.existsSync(REAL) ? REAL : SVG;
const BG = '#0a1626'; // matches the icon background (for opaque apple icon / maskable)

const outDir = 'public/icons';
fs.mkdirSync(outDir, { recursive: true });

function load(size, density = 512) {
  // Rasterize SVG at high density so it stays crisp; PNGs just resize.
  return source.endsWith('.svg')
    ? sharp(source, { density: Math.max(density, size) }).resize(size, size, { fit: 'cover' })
    : sharp(source).resize(size, size, { fit: 'cover' });
}

async function plain(size, file) {
  await load(size).png().toFile(path.join(outDir, file));
  console.log('✓', file, `${size}x${size}`);
}

// Maskable / apple icons: place the art on an opaque background with a safe margin
async function padded(size, file, marginPct) {
  const inner = Math.round(size * (1 - marginPct * 2));
  const art = await load(inner).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toFile(path.join(outDir, file));
  console.log('✓', file, `${size}x${size} (maskable-safe)`);
}

console.log('Source:', source);
await plain(192, 'icon-192.png');
await plain(512, 'icon-512.png');
await plain(32, 'favicon-32.png');
await padded(512, 'icon-maskable-512.png', 0.12); // >=10% safe zone for maskable
await padded(180, 'apple-touch-icon.png', 0.08); // iOS rounds corners itself

// Next.js App Router favicon convention
await load(64).png().toFile('src/app/icon.png');
console.log('✓ src/app/icon.png (favicon)');
console.log('Done.');
