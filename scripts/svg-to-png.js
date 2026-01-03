const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// Convert SVG to PNG using sharp
async function convertSvgToPng() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons')
  const sizes = [192, 512]

  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`)
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`)

    try {
      await sharp(svgPath).resize(size, size).png().toFile(pngPath)

      console.log(`Converted ${svgPath} to ${pngPath}`)
    } catch (error) {
      console.error(`Error converting ${svgPath}:`, error)
    }
  }
}

convertSvgToPng().catch(console.error)
