const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = 'C:/Users/Khushdeep Kakria/.gemini/antigravity/brain/be47123d-0d06-47df-bdb0-9f28f7517ee9/.user_uploaded/media_1789625141572.jpg';
const DEST = path.resolve(__dirname, '..', 'public', 'images', 'products');

console.log('Output directory:', DEST);
if (!fs.existsSync(DEST)) {
  fs.mkdirSync(DEST, { recursive: true });
}

const crops = [
  { file: 'ghee-cow.jpg',       crop: [0,   0,   205, 230] },
  { file: 'ghee-buffalo.jpg',   crop: [205, 0,   205, 230] },
  { file: 'ghee-a2-binola.jpg', crop: [410, 0,   205, 230] },
  { file: 'paneer.jpg',         crop: [615, 0,   205, 230] },
  { file: 'khoya.jpg',          crop: [820, 0,   204, 230] },
  { file: 'milk-buffalo.jpg',   crop: [0,   227, 205, 227] },
  { file: 'milk-cow.jpg',       crop: [205, 227, 205, 227] },
  { file: 'milk-skimmed.jpg',   crop: [410, 227, 205, 227] },
  { file: 'dahi.jpg',           crop: [615, 227, 205, 227] },
  { file: 'lassi-chatti.jpg',   crop: [820, 227, 204, 227] },
  { file: 'lassi-sweet.jpg',    crop: [0,   454, 205, 228] },
  { file: 'lassi-khatti.jpg',   crop: [205, 454, 205, 228] },
  { file: 'chatti-milk.jpg',    crop: [615, 454, 205, 228] },
  { file: 'butter-white.jpg',   crop: [820, 454, 204, 228] },
];

function wm(w, h) {
  const bw = Math.round(w * 0.38);
  const bh = Math.round(h * 0.13);
  const x = w - bw - 6;
  const y = h - bh - 6;
  return Buffer.from(
    '<svg width="' + w + '" height="' + h + '" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="4" ry="4" fill="#184E2E" opacity="0.75"/>' +
    '<text x="' + (x + bw/2) + '" y="' + (y + bh*0.6) + '" font-family="Arial, sans-serif" font-size="' + Math.round(bh*0.45) + '" font-weight="bold" fill="#F3B638" text-anchor="middle">' +
    'KAKRIA DAIRY' +
    '</text>' +
    '</svg>'
  );
}

async function run() {
  for (const { file, crop: [left, top, width, height] } of crops) {
    const dest = path.join(DEST, file);
    const watermark = wm(width, height);

    await sharp(SRC)
      .extract({ left, top, width, height })
      .composite([{ input: watermark, blend: 'over' }])
      .jpeg({ quality: 93 })
      .toFile(dest);

    const stat = fs.statSync(dest);
    console.log('OK', file, stat.size + 'B');
  }
  console.log('Done — all 14 product images extracted.');
}

run().catch(console.error);
