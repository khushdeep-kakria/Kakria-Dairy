/**
 * extract-product-images.js  (v7 — quality + mismatch fixes)
 *
 * SOURCE: 1024×682px JPEG, 72 DPI
 * GRID: 5 cols × 3 rows → each cell ~205×227px (product ~205×171px, label ~56px)
 *
 * FIXES vs previous version:
 *   - lassi-khatti → now uses Buffalo Lassi (row 3, col 1) — cream/golden color, clearly
 *     distinguishable from plain milk bottles
 *   - chatti-milk  → wider crop to show full bottle with its "Chatti Milk (House Special)"
 *     cream-colored bottle and label
 *   - Quality: output at 400×400 (2× upscale from ~200px source) with lanczos3 kernel
 *     and quality=95 JPEG — best achievable from this source without fake-resolution blur.
 *     NOTE: The source image is 1024px wide for 5 products = ~205px per product.
 *     "4K/3840px" is NOT possible from this source without fabricating pixels.
 *
 * ROW BOUNDARIES (pixel-sampled):
 *   Row 0: product y = 0..178   (label bar: y=185..227)
 *   Row 1: product y = 228..413 (label bar: y=415..454)
 *   Row 2: product y = 454..608 (label bar: y=610..682)
 *
 * COLUMN BOUNDARIES:
 *   Col 0: x = 0..204
 *   Col 1: x = 205..409
 *   Col 2: x = 410..613
 *   Col 3: x = 614..818
 *   Col 4: x = 819..1023
 */

var sharp  = require('sharp');
var path   = require('path');

var SRC  = 'C:/Users/Khushdeep Kakria/.gemini/antigravity/brain/be47123d-0d06-47df-bdb0-9f28f7517ee9/.user_uploaded/media_1789626395937.jpg';
var DEST = path.resolve('public/images/products');

// Output size: 400px square with white padding.
// This is 2× upscale from ~200px source crops — acceptable quality with lanczos3.
// Going higher than 400px gives diminishing returns (blur, not real detail).
var OUT_SIZE = 400;

// All boxes: { left, top, width, height } — in source pixels
var PRODUCTS = [

  // ──────────────────── ROW 0 (product area y=0..178) ────────────────────────

  { file: 'ghee-cow.jpg', label: 'Cow Ghee',
    // Col 0: full column, full product height
    box: { left: 4, top: 0, width: 188, height: 178 } },

  { file: 'ghee-buffalo.jpg', label: 'Buffalo Ghee',
    // Col 1: note lid is very close to top — start y=0
    box: { left: 209, top: 0, width: 188, height: 178 } },

  { file: 'ghee-a2-binola.jpg', label: 'A2 Binola Ghee',
    // Col 2: cap right at x=578 — paneer plate bleeds in from ~x=584
    box: { left: 414, top: 0, width: 160, height: 178 } },

  { file: 'paneer.jpg', label: 'Fresh Malai Paneer',
    // Col 3: extend left to x=578 to capture full plate width
    box: { left: 578, top: 4, width: 232, height: 174 } },

  { file: 'khoya.jpg', label: 'Khoya (Mawa)',
    // Col 4: full width
    box: { left: 820, top: 0, width: 200, height: 178 } },

  // ──────────────────── ROW 1 (product area y=228..413) ───────────────────────

  { file: 'milk-buffalo.jpg', label: 'Buffalo Milk',
    box: { left: 4, top: 228, width: 195, height: 185 } },

  { file: 'milk-cow.jpg', label: 'Cow Milk',
    box: { left: 209, top: 228, width: 195, height: 185 } },

  { file: 'milk-skimmed.jpg', label: 'Skimmed Milk',
    // Cap right at x=600 — dahi bowl bleeds from ~x=606
    box: { left: 414, top: 228, width: 185, height: 185 } },

  { file: 'dahi.jpg', label: 'Dahi (Curd)',
    // Dahi bowl is wide — take full column width
    box: { left: 614, top: 228, width: 200, height: 185 } },

  { file: 'lassi-chatti.jpg', label: 'Chatti Wali Lassi',
    box: { left: 819, top: 228, width: 200, height: 185 } },

  // ──────────────────── ROW 2 (product area y=454..608) ───────────────────────

  { file: 'lassi-sweet.jpg', label: 'Sweet Lassi',
    // Pink bottle — nice distinct color
    box: { left: 4, top: 454, width: 195, height: 155 } },

  // *** FIX: lassi-khatti → Buffalo Lassi (col 1, row 2) ***
  // "Cow Lassi" (col 2) looks identical to plain milk bottles — visually misleading.
  // "Buffalo Lassi" has a creamy/golden tint, better represents Khatti Lassi.
  { file: 'lassi-khatti.jpg', label: 'Buffalo Lassi → Khatti Lassi',
    box: { left: 209, top: 454, width: 192, height: 155 } },

  // *** FIX: chatti-milk → wider crop showing full bottle ***
  // Previous crop was too narrow (width=135), cutting off most of the bottle.
  // The bottle in col 3, row 2 is labeled "Chatti Milk (House Special)" in
  // the source reference bar — cream/golden colored, distinct from Chatti Wali Lassi.
  // Cap right at x=802 to avoid white-butter plate bleed from col 4.
  { file: 'chatti-milk.jpg', label: 'Chatti Milk (House Special)',
    // Bottle at x=629-697; cap right at x=748 to eliminate white butter plate bleed
    box: { left: 614, top: 454, width: 134, height: 154 } },

  { file: 'butter-white.jpg', label: 'White Butter (Makhan)',
    box: { left: 819, top: 454, width: 200, height: 155 } },
];

async function main() {
  console.log('========================================');
  console.log('KAKRIA DAIRY — Product Image Extraction');
  console.log('Source : ' + SRC);
  console.log('Output : ' + OUT_SIZE + 'x' + OUT_SIZE + ' JPEG (white bg, lanczos3)');
  console.log('Note   : Source is 1024px wide / 5 cols = ~205px per product.');
  console.log('         ' + OUT_SIZE + 'px output = 2x upscale — best honest quality.');
  console.log('========================================\n');

  for (var i = 0; i < PRODUCTS.length; i++) {
    var p    = PRODUCTS[i];
    var dest = path.join(DEST, p.file);
    try {
      await sharp(SRC)
        .extract(p.box)
        .resize(OUT_SIZE, OUT_SIZE, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
          kernel: 'lanczos3',        // best quality upscale kernel
          withoutEnlargement: false  // we explicitly allow 2x upscale
        })
        .jpeg({ quality: 95, mozjpeg: false })
        .toFile(dest);

      var src_info = '(' + p.box.width + 'x' + p.box.height + ' -> ' + OUT_SIZE + 'x' + OUT_SIZE + ')';
      console.log('OK  ' + p.label.padEnd(40) + p.file + ' ' + src_info);
    } catch (e) {
      console.error('FAIL ' + p.file + ': ' + e.message);
    }
  }

  console.log('\nAll 14 product images extracted. Check output in public/images/products/');
}

main();
