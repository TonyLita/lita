const fs = require('fs');
const path = require('path');
const https = require('https');

const iconsDir = path.join(__dirname, '..', 'assets', 'img', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log(`✓ Created directory: ${iconsDir}`);
}

// Technologies to download from Simple Icons
const technologies = [
  // Languages
  'javascript',
  'typescript',
  'java',
  'python',
  'html5',
  'css3',
  'php',
  'sql',

  // Frameworks/Libraries
  'react',
  'angular',
  'vuedotjs',
  'nodejs',
  'express',
  'springboot',
  'laravel',
  'django',
  'fastapi',
  'graphql',

  // Databases
  'postgresql',
  'mysql',
  'mongodb',
  'redis',

  // Tools/DevOps
  'docker',
  'git',
  'github',
  'webpack',
  'vite',
  'figma',
  'visualstudiocode',
  'postman',
  'linux',
  'jenkins',
  'github-actions',
];

// Fetch and save each icon
function downloadIcon(name) {
  return new Promise((resolve, reject) => {
    const url = `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${name}.svg`;
    const filename = `${name}.svg`;
    const filepath = path.join(iconsDir, filename);

    https.get(url, (response) => {
      if (response.statusCode === 404) {
        console.log(`✗ Not found: ${name}`);
        resolve();
        return;
      }

      if (response.statusCode !== 200) {
        console.log(`✗ Error (${response.statusCode}): ${name}`);
        resolve();
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✓ Downloaded: ${filename}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete incomplete file
        console.log(`✗ Error saving ${filename}:`, err.message);
        resolve();
      });
    }).on('error', (err) => {
      console.log(`✗ Error downloading ${name}:`, err.message);
      resolve();
    });
  });
}

// Download all icons sequentially
async function downloadAll() {
  console.log(`\nDownloading ${technologies.length} icons...\n`);

  for (const tech of technologies) {
    await downloadIcon(tech);
  }

  console.log(`\n✓ Done. Icons saved to: ${iconsDir}`);
  const count = fs.readdirSync(iconsDir).length;
  console.log(`✓ Total icons: ${count}`);
}

downloadAll().catch(console.error);
