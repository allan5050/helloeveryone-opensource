const fs = require('fs')
const path = require('path')

// Function to create a proper icon with the specified size (requires canvas)
function createIcon(size) {
  const { createCanvas } = require('canvas')
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#8B5CF6') // purple
  gradient.addColorStop(1, '#EC4899') // pink
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  // Add "HE" text
  ctx.fillStyle = 'white'
  ctx.font = `bold ${size * 0.35}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('HE', size / 2, size / 2)

  return canvas.toBuffer('image/png')
}

// Create simple icon without canvas (fallback)
function createSimpleIcon(size) {
  // This creates a more complex PNG than 1x1 - it's a simple colored square
  const { PNG } = require('pngjs')
  const png = new PNG({ width: size, height: size })

  // Fill with purple gradient effect (simplified)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2
      const ratio = (x + y) / (size * 2)

      // Purple to pink gradient
      png.data[idx] = Math.floor(139 + (236 - 139) * ratio) // R
      png.data[idx + 1] = Math.floor(92 + (72 - 92) * ratio) // G
      png.data[idx + 2] = Math.floor(246 + (153 - 246) * ratio) // B
      png.data[idx + 3] = 255 // A
    }
  }

  return PNG.sync.write(png)
}

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = path.join(__dirname, '..', 'public', 'icons')

console.log('Generating real PWA icons...')

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
  console.log('Created icons directory')
}

// Check if we have canvas available
let useCanvas = false
try {
  require('canvas')
  useCanvas = true
  console.log('Using canvas for high-quality icons')
} catch (e) {
  console.log('Canvas not available, using fallback method')
  try {
    require('pngjs')
  } catch (e2) {
    console.log('pngjs not available either. Install with: npm install pngjs')
    console.log('Or for better quality: npm install canvas')
    process.exit(1)
  }
}

// Generate icons
iconSizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`
  const filepath = path.join(iconsDir, filename)

  try {
    const buffer = useCanvas ? createIcon(size) : createSimpleIcon(size)
    fs.writeFileSync(filepath, buffer)
    console.log(`✓ Generated ${filename}`)
  } catch (err) {
    console.error(`✗ Failed to generate ${filename}:`, err.message)
  }
})

// Create apple-touch-icon (180x180)
const appleIconPath = path.join(iconsDir, 'apple-touch-icon.png')
try {
  const buffer = useCanvas ? createIcon(180) : createSimpleIcon(180)
  fs.writeFileSync(appleIconPath, buffer)
  console.log('✓ Generated apple-touch-icon.png')
} catch (err) {
  console.error('✗ Failed to generate apple-touch-icon.png:', err.message)
}

// Create favicon files
;[16, 32].forEach(size => {
  const filename = `favicon-${size}x${size}.png`
  const filepath = path.join(iconsDir, filename)
  try {
    const buffer = useCanvas ? createIcon(size) : createSimpleIcon(size)
    fs.writeFileSync(filepath, buffer)
    console.log(`✓ Generated ${filename}`)
  } catch (err) {
    console.error(`✗ Failed to generate ${filename}:`, err.message)
  }
})

console.log('\nIcon generation complete!')
