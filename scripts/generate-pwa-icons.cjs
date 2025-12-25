/**
 * Générateur d'icônes PWA - Smart Food Manager
 *
 * Ce script génère des icônes placeholder SVG pour la PWA.
 * Pour des icônes professionnelles, utiliser:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 *
 * Usage:
 *   node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Template SVG avec logo Smart Food Manager
const generateSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#10b981"/>

  <!-- Chef Hat Icon (simplified) -->
  <g transform="translate(${size * 0.25}, ${size * 0.25}) scale(${size / 200})">
    <!-- Hat top -->
    <ellipse cx="50" cy="35" rx="45" ry="25" fill="white"/>
    <!-- Hat base -->
    <rect x="10" y="50" width="80" height="30" rx="5" fill="white"/>
    <rect x="5" y="75" width="90" height="10" rx="3" fill="white"/>
  </g>

  <!-- Text "SFM" -->
  <text
    x="${size / 2}"
    y="${size * 0.8}"
    font-family="Inter, -apple-system, sans-serif"
    font-size="${size * 0.12}"
    font-weight="900"
    fill="white"
    text-anchor="middle"
  >SFM</text>
</svg>`;

// Créer dossier si n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Générer chaque taille
SIZES.forEach(size => {
  const svg = generateSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, svg, 'utf8');
  console.log(`✓ Généré: ${filename}`);
});

// Générer également en PNG si sharp est installé
try {
  const sharp = require('sharp');

  console.log('\n📸 Conversion PNG avec Sharp...');

  SIZES.forEach(async (size) => {
    const svgPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.svg`);
    const pngPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(pngPath);

    console.log(`✓ PNG: icon-${size}x${size}.png`);
  });

} catch (err) {
  console.log('\n⚠️  Sharp non installé - icônes SVG générées uniquement');
  console.log('Pour générer des PNG, installer: npm install sharp --save-dev');
  console.log('Puis relancer ce script.');
}

console.log('\n✅ Icônes PWA générées dans public/icons/');
console.log('\n💡 Pour des icônes professionnelles:');
console.log('   1. Créer logo 1024x1024 dans Figma/Photoshop');
console.log('   2. Uploader sur https://realfavicongenerator.net/');
console.log('   3. Télécharger et remplacer dans public/icons/');
