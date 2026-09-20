/**
 * fix-chatti-milk-label-v3.js
 *
 * Replaces the product-name banner on chatti-milk.jpg with a correctly-styled
 * label that matches the KAKRIA DAIRY design system used across all other products:
 *   - Green shield badge (already intact from reference — KAKRIA DAIRY + cow icon)
 *   - Gold/cream rounded rectangle below the badge with "Chatti Milk"
 *   - Smaller italic "(House Special)" sub-line
 *
 * Input:  public/images/products/chatti-milk-clean.jpg  (unmodified crop)
 * Output: public/images/products/chatti-milk.jpg
 */

const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

// ─── Helper: sample average colour of a region ───────────────────────────────
async function avgColour(imgBuf, x, y, w, h) {
  var d = await sharp(imgBuf)
    .extract({ left: x, top: y, width: w, height: h })
    .raw()
    .toBuffer();
  var sr = 0, sg = 0, sb = 0, n = w * h;
  for (var i = 0; i < n; i++) { sr += d[i*3]; sg += d[i*3+1]; sb += d[i*3+2]; }
  return { r: Math.round(sr/n), g: Math.round(sg/n), b: Math.round(sb/n) };
}

async function main() {
  var cleanPath = path.resolve('public/images/products/chatti-milk-clean.jpg');
  var outPath   = path.resolve('public/images/products/chatti-milk.jpg');

  if (!fs.existsSync(cleanPath)) {
    throw new Error('chatti-milk-clean.jpg not found. Run extract script first.');
  }

  var imgBuf = fs.readFileSync(cleanPath);

  // ── 1. Measure the label banner geometry in the 400×400 image ──────────────
  // From pixel sampling:
  //   - Cream/gold banner starts at y≈274 (below green badge bottom)
  //   - Banner ends at y≈334 (before glass bottle base continues)
  //   - Banner left edge (where cream is visible) x≈60, right x≈260
  // The "Chatti Lassi" text occupies this cream banner.
  // We cover the banner and replace the text.

  // Sample the cream colour at top and bottom of the banner (clean rows)
  var topCream    = await avgColour(imgBuf, 80, 276, 140, 3);
  var bottomCream = await avgColour(imgBuf, 80, 330, 140, 3);
  var midCream    = await avgColour(imgBuf, 80, 303, 140, 3);

  console.log('Banner top colour:    rgb(' + topCream.r    + ',' + topCream.g    + ',' + topCream.b    + ')');
  console.log('Banner mid colour:    rgb(' + midCream.r    + ',' + midCream.g    + ',' + midCream.b    + ')');
  console.log('Banner bottom colour: rgb(' + bottomCream.r + ',' + bottomCream.g + ',' + bottomCream.b + ')');

  // ── 2. Build the SVG label patch ────────────────────────────────────────────
  // The banner in all reference labels is a warm cream/gold colour:
  // - Border: thin dark-brown stroke matching the badge outline
  // - Fill: gradient from top-cream to bottom-cream
  // - Text: dark brown, bold, matching label typography

  // Colours derived from sampling
  var c1 = 'rgb(' + topCream.r    + ',' + topCream.g    + ',' + topCream.b    + ')';
  var c2 = 'rgb(' + midCream.r    + ',' + midCream.g    + ',' + midCream.b    + ')';
  var c3 = 'rgb(' + bottomCream.r + ',' + bottomCream.g + ',' + bottomCream.b + ')';

  // Label banner geometry (in 400px image coords)
  // x=60 to x=258 (width=198), y=274 to y=336 (height=62)
  // We use a slight horizontal fade to respect the curved bottle edges
  var LX = 60, LY = 274, LW = 198, LH = 62;
  var CX = LX + LW / 2; // centre x = 159

  // Dark brown text colour — matching other labels
  var TEXT_COL = '#1A0D05';
  // Border colour for the banner rectangle
  var BORDER_COL = '#5C3B14';

  var svg = '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">' +

    '<defs>' +
    // Vertical gradient for the banner fill — matches the organic cream-gold feel
    '<linearGradient id="bannerGrad" x1="0" y1="0" x2="0" y2="1">' +
    '  <stop offset="0"   stop-color="' + c1 + '"/>' +
    '  <stop offset="0.5" stop-color="' + c2 + '"/>' +
    '  <stop offset="1"   stop-color="' + c3 + '"/>' +
    '</linearGradient>' +
    // Horizontal fade at left/right edges to blend with curved bottle
    '<linearGradient id="hFade" x1="0" y1="0" x2="1" y2="0">' +
    '  <stop offset="0"    stop-color="white" stop-opacity="1"/>' +
    '  <stop offset="0.08" stop-color="white" stop-opacity="0"/>' +
    '  <stop offset="0.92" stop-color="white" stop-opacity="0"/>' +
    '  <stop offset="1"    stop-color="white" stop-opacity="1"/>' +
    '</linearGradient>' +
    '<mask id="edgeMask">' +
    '  <rect x="' + LX + '" y="' + LY + '" width="' + LW + '" height="' + LH + '" fill="white"/>' +
    '  <rect x="' + LX + '" y="' + LY + '" width="' + LW + '" height="' + LH + '" fill="url(#hFade)"/>' +
    '</mask>' +
    '</defs>' +

    // Cover rectangle — solid fill matching banner colour
    '<rect x="' + LX + '" y="' + LY + '" width="' + LW + '" height="' + LH + '"' +
    '  fill="url(#bannerGrad)" mask="url(#edgeMask)"/>' +

    // Thin border lines at top and bottom of banner (matches other labels)
    '<line x1="' + (LX+8) + '" y1="' + LY + '" x2="' + (LX+LW-8) + '" y2="' + LY + '"' +
    '  stroke="' + BORDER_COL + '" stroke-width="1.2" opacity="0.55"/>' +
    '<line x1="' + (LX+8) + '" y1="' + (LY+LH) + '" x2="' + (LX+LW-8) + '" y2="' + (LY+LH) + '"' +
    '  stroke="' + BORDER_COL + '" stroke-width="1.2" opacity="0.55"/>' +

    // Product name: "Chatti Milk"
    // Font: bold, slightly condensed — matches label style
    '<text' +
    '  x="' + CX + '" y="' + (LY + 36) + '"' +
    '  font-family="\'Arial Narrow\',Arial,Helvetica,sans-serif"' +
    '  font-weight="800"' +
    '  font-size="24"' +
    '  fill="' + TEXT_COL + '"' +
    '  text-anchor="middle"' +
    '  letter-spacing="0.2">' +
    'Chatti Milk' +
    '</text>' +

    // Sub-label: "(House Special)"
    '<text' +
    '  x="' + CX + '" y="' + (LY + 55) + '"' +
    '  font-family="Arial,Helvetica,sans-serif"' +
    '  font-weight="500"' +
    '  font-style="italic"' +
    '  font-size="13"' +
    '  fill="' + TEXT_COL + '"' +
    '  text-anchor="middle"' +
    '  letter-spacing="0">' +
    '(House Special)' +
    '</text>' +

  '</svg>';

  var svgBuf = Buffer.from(svg, 'utf8');

  // ── 3. Composite onto the clean base ────────────────────────────────────────
  await sharp(imgBuf)
    .composite([{ input: svgBuf, top: 0, left: 0, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toFile(outPath);

  console.log('');
  console.log('SUCCESS — saved: ' + outPath);
  console.log('Label now reads: "Chatti Milk (House Special)"');
  console.log('Branding: cream/gold banner with dark-brown text matching KAKRIA DAIRY style.');
}

main().catch(function(e) {
  console.error('ERROR:', e.message);
  process.exit(1);
});
