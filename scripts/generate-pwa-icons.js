const fs = require('fs')
const path = require('path')

// Create a simple placeholder PNG (1x1 pixel) for testing
// In production, you'd use proper icon generation tools
const createPlaceholderPNG = () => {
  // Minimal valid PNG file (1x1 transparent pixel)
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ])
}

const iconSizes = [72, 96, 128, 144, 152, 384]
const iconsDir = path.join(__dirname, '..', 'public', 'icons')

console.log('Creating missing PWA icon files...')

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
  console.log('Created icons directory')
}

// Create missing icon files
iconSizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`
  const filepath = path.join(iconsDir, filename)

  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, createPlaceholderPNG())
    console.log(`Created ${filename}`)
  } else {
    console.log(`${filename} already exists`)
  }
})

// Check for 192 and 512 (should already exist)
;[192, 512].forEach(size => {
  const filename = `icon-${size}x${size}.png`
  const filepath = path.join(iconsDir, filename)
  if (fs.existsSync(filepath)) {
    console.log(`${filename} already exists`)
  }
})

// Create apple-touch-icon
const appleIconPath = path.join(iconsDir, 'apple-touch-icon.png')
if (!fs.existsSync(appleIconPath)) {
  fs.writeFileSync(appleIconPath, createPlaceholderPNG())
  console.log('Created apple-touch-icon.png')
}

// Create favicon files
const faviconSizes = [16, 32]
faviconSizes.forEach(size => {
  const filename = `favicon-${size}x${size}.png`
  const filepath = path.join(iconsDir, filename)
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, createPlaceholderPNG())
    console.log(`Created ${filename}`)
  }
})

console.log('\nIcon generation complete!')
console.log(
  'Note: These are placeholder icons. For production, use proper icon generation tools.'
)
