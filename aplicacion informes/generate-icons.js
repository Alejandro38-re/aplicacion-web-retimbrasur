#!/usr/bin/env node
const sharp = require('sharp');
const fs = require('fs');

// SVG del icono de extintor (basado en el diseño del icon-generator.html)
const iconSVG = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#d32f2f;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#b71c1c;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" fill="url(#bgGradient)"/>

  <!-- Fire Extinguisher Icon -->
  <g transform="translate(256, 256)">
    <!-- Top cap -->
    <rect x="-53.33" y="-106.67" width="106.67" height="53.33" fill="#333333" rx="8"/>

    <!-- Main body -->
    <rect x="-80" y="-53.33" width="160" height="213.33" fill="white" rx="8"/>

    <!-- Handle -->
    <path d="M -40 -80 Q 0 -120 40 -80" stroke="#333333" stroke-width="10" fill="none" stroke-linecap="round"/>

    <!-- Hose -->
    <path d="M 80 0 Q 120 40 100 80" stroke="#333333" stroke-width="8" fill="none" stroke-linecap="round"/>

    <!-- Pressure gauge -->
    <circle cx="0" cy="-20" r="32" fill="#ffd700"/>
    <circle cx="0" cy="-20" r="24" fill="#f9a825"/>

    <!-- Nozzle -->
    <rect x="80" y="73.33" width="26.67" height="40" fill="#333333" rx="4"/>

    <!-- Label -->
    <text x="0" y="140" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">PCI</text>
  </g>
</svg>
`;

async function generateIcons() {
  try {
    console.log('🎨 Generando iconos PWA...\n');

    // Guardar SVG temporal
    const svgPath = './temp-icon.svg';
    fs.writeFileSync(svgPath, iconSVG);

    // Generar icon-192.png
    await sharp(svgPath)
      .resize(192, 192)
      .png()
      .toFile('./icon-192.png');
    console.log('✅ icon-192.png generado correctamente (192x192)');

    // Generar icon-512.png
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile('./icon-512.png');
    console.log('✅ icon-512.png generado correctamente (512x512)');

    // Limpiar archivo temporal
    fs.unlinkSync(svgPath);

    console.log('\n🎉 ¡Iconos PWA generados exitosamente!');
    console.log('📁 Los archivos están listos en la carpeta de la aplicación.');

  } catch (error) {
    console.error('❌ Error al generar los iconos:', error.message);
    process.exit(1);
  }
}

generateIcons();
