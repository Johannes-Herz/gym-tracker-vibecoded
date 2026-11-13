// Generates the PWA icons (dumbbell on dark background) without dependencies.
// Usage: node scripts/generate-icons.mjs
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [0x11, 0x18, 0x27]
const FG = [0xf9, 0xfa, 0xfb]

// Shapes in a 100x100 box: [x, y, w, h, radius]. Everything stays inside the
// central 60% so the icon also works as a maskable icon.
const SHAPES = [
  [30, 47, 40, 6, 1], // bar
  [25, 36, 6, 28, 2], // inner plates
  [69, 36, 6, 28, 2],
  [18, 41, 6, 18, 2], // outer plates
  [76, 41, 6, 18, 2],
]

function inside(px, py) {
  for (const [x, y, w, h, r] of SHAPES) {
    if (px < x || px > x + w || py < y || py > y + h) continue
    const cx = Math.min(Math.max(px, x + r), x + w - r)
    const cy = Math.min(Math.max(py, y + r), y + h - r)
    if ((px - cx) ** 2 + (py - cy) ** 2 <= r * r) return true
  }
  return false
}

function crcTable() {
  const t = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
}
const CRC = crcTable()
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function png(size) {
  const SS = 3
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3)
    for (let x = 0; x < size; x++) {
      let hits = 0
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++)
          if (inside(((x + (sx + 0.5) / SS) / size) * 100, ((y + (sy + 0.5) / SS) / size) * 100)) hits++
      const a = hits / (SS * SS)
      for (let c = 0; c < 3; c++) row[1 + x * 3 + c] = Math.round(BG[c] + (FG[c] - BG[c]) * a)
    }
    rows.push(row)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), png(size))
  console.log('wrote', name)
}
