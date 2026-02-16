const fs = require('fs');
const path = require('path');
const https = require('https');

const assets = [
  'olos-logo-3d.png',
  'snake.png',
  'jumping-jack.png',
  'bounce.png',
  'tetris.png'
];

const baseUri = 'https://vxeisxosdfhmnvkyqffu.supabase.co/storage/v1/object/public/artifacts/6f7e3c8a-7b3f-4e1a-8f4b-8d7b3c8a7b3f/';
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(publicDir, filename));
    const url = baseUri + filename;

    console.log(`Downloading ${filename}...`);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(path.join(publicDir, filename), () => {}); // Delete the file async. (But we don't check the result)
      reject(err);
    });
  });
}

async function downloadAll() {
  for (const asset of assets) {
    try {
      await downloadFile(asset);
    } catch (err) {
      console.error(`Error downloading ${asset}:`, err.message);
    }
  }
}

downloadAll();
