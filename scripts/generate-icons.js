const fs = require('fs')
const path = require('path')

// SVG icon template
const createSVG =
  size => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#gradient)" />
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.35}" fill="white" />
  <text x="${size / 2}" y="${size / 2}" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="#6366f1" text-anchor="middle" dominant-baseline="middle">HE</text>
</svg>`

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Generate SVG files
const sizes = [192, 512]
sizes.forEach(size => {
  const svg = createSVG(size)
  const filename = path.join(iconsDir, `icon-${size}x${size}.svg`)
  fs.writeFileSync(filename, svg)
  console.log(`Generated ${filename}`)
})

console.log(
  'Icon generation complete! You can convert these SVGs to PNGs using an online tool or image editor.'
)
