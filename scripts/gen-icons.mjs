import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Source priority: your real artwork (drop it here) > the vector fallback.
const CANDIDATES = ['public/branding/app-icon.png', 'public/branding/turf-gilt.png'];
const SVG = 'public/branding/icon.svg';
const source = CANDIDATES.find((p) => fs.existsSync(p)) || SVG;
const BG = '#0b2b1a'; // dark green to match the TurfSplit icon background

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

// Full-bleed variant for platform crops (maskable/apple): trim the surrounding
// white margin so the green tile reaches the edges, then cover-fill on BG.
async function bleed(size, file) {
  let img = sharp(source, source.endsWith('.svg') ? { density: Math.max(1024, size) } : {});
  if (!source.endsWith('.svg')) {
    // Remove the white border around the rounded tile
    img = img.trim({ background: '#ffffff', threshold: 20 });
  }
  const art = await img.resize(size, size, { fit: 'cover' }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toFile(path.join(outDir, file));
  console.log('✓', file, `${size}x${size} (full-bleed)`);
}

console.log('Source:', source);
await plain(192, 'icon-192.png');
await plain(512, 'icon-512.png');
await plain(32, 'favicon-32.png');
await bleed(512, 'icon-maskable-512.png'); // Android masks to circle/squircle
await bleed(180, 'apple-touch-icon.png'); // iOS rounds corners itself

// Next.js App Router favicon convention
await load(64).png().toFile('src/app/icon.png');
console.log('✓ src/app/icon.png (favicon)');
console.log('Done.');
