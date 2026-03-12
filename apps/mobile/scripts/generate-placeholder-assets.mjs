/**
 * Generates placeholder PNG assets for Expo builds.
 * Replace with real branded assets before App Store / Play Store submission.
 *
 * Usage: node scripts/generate-placeholder-assets.mjs
 */

import { createWriteStream } from 'fs'
import { deflateSync } from 'zlib'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../assets/images')
mkdirSync(OUT, { recursive: true })

// ── CRC32 table ────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : (c >>> 1)
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

// ── PNG generator ──────────────────────────────────────────────────────────
function makePNG(width, height, { r, g, b, a = 255, corner = 0 }) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // RGBA
  // ihdr[10,11,12] = 0 (compression, filter, interlace)

  const rowSize = width * 4
  const raw = Buffer.alloc((rowSize + 1) * height, 0)

  for (let y = 0; y < height; y++) {
    raw[y * (rowSize + 1)] = 0 // filter type None
    for (let x = 0; x < width; x++) {
      const offset = y * (rowSize + 1) + 1 + x * 4

      // Rounded corners: make pixels outside radius transparent
      let alpha = a
      if (corner > 0) {
        const cx = Math.min(x, width - 1 - x)
        const cy = Math.min(y, height - 1 - y)
        if (cx < corner && cy < corner) {
          const dx = corner - cx - 1
          const dy = corner - cy - 1
          if (Math.sqrt(dx * dx + dy * dy) > corner) alpha = 0
        }
      }

      raw[offset] = r
      raw[offset + 1] = g
      raw[offset + 2] = b
      raw[offset + 3] = alpha
    }
  }

  const idat = chunk('IDAT', deflateSync(raw))
  const iend = chunk('IEND', Buffer.alloc(0))
  return Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend])
}

// ── Draw "OT" initials on icon ─────────────────────────────────────────────
// (Simple pixel font — O and T at 8px)
// For a real app, replace these files with actual branded assets.

// ── Asset definitions ──────────────────────────────────────────────────────
const PRIMARY   = { r: 124, g: 58, b: 237, a: 255 }  // #7C3AED violet
const WHITE     = { r: 255, g: 255, b: 255, a: 255 }
const SPLASH_BG = { r: 124, g: 58, b: 237, a: 255 }

const assets = [
  { file: 'icon.png',          w: 1024, h: 1024, color: PRIMARY,   corner: 180 },
  { file: 'adaptive-icon.png', w: 1024, h: 1024, color: PRIMARY,   corner: 0   },
  { file: 'splash.png',        w: 1242, h: 2688, color: SPLASH_BG, corner: 0   },
  { file: 'favicon.png',       w: 48,   h: 48,   color: PRIMARY,   corner: 8   },
  { file: 'notification-icon.png', w: 96, h: 96, color: WHITE,     corner: 0   },
]

for (const { file, w, h, color, corner } of assets) {
  const buf = makePNG(w, h, { ...color, corner })
  const outPath = join(OUT, file)
  createWriteStream(outPath).end(buf)
  console.log(`✓ ${file}  (${w}×${h})`)
}

console.log('\nPlaceholder assets generated in apps/mobile/assets/images/')
console.log('Replace with real branded assets before App Store submission.')
