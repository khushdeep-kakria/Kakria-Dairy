const fs = require('fs');
const path = require('path');
const https = require('https');

const images = [
  {
    filename: 'ghee-cow.jpg',
    url: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'ghee-buffalo.jpg',
    url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'ghee-a2-binola.jpg',
    url: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'paneer.jpg',
    url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'khoya.jpg',
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'milk-buffalo.jpg',
    url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'milk-cow.jpg',
    url: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'milk-skimmed.jpg',
    url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'dahi.jpg',
    url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'lassi-chatti.jpg',
    url: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'lassi-sweet.jpg',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'lassi-khatti.jpg',
    url: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'chatti-milk.jpg',
    url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'butter-white.jpg',
    url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80',
  },
  {
    filename: 'farm-hero.jpg',
    url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80',
  },
  {
    filename: 'farm-dairy.jpg',
    url: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=1000&q=80',
  }
];

const targetDir = path.join(__dirname, '..', 'public', 'images', 'products');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Follow redirect
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status code ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('Downloading high quality placeholder images for products...');
  for (const item of images) {
    const dest = path.join(targetDir, item.filename);
    try {
      await download(item.url, dest);
      console.log(`✓ Downloaded ${item.filename}`);
    } catch (err) {
      console.warn(`! Failed downloading ${item.filename}: ${err.message}. Generating SVG fallback.`);
      // Fallback SVG
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
        <rect width="100%" height="100%" fill="#FAF6EE"/>
        <circle cx="300" cy="225" r="140" fill="#F0E7D5"/>
        <text x="300" y="220" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="#184E2E" text-anchor="middle">${item.filename.replace('.jpg','')}</text>
        <text x="300" y="255" font-family="sans-serif" font-size="16" fill="#D99B26" text-anchor="middle">Kakria Dairy Self-Made</text>
      </svg>`;
      fs.writeFileSync(dest, svg);
    }
  }
  console.log('All product images ready in /public/images/products/');
}

run();
