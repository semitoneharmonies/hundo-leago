import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
const directory = new URL("../public/icons/", import.meta.url);
mkdirSync(directory, { recursive: true });
function crc(bytes) { let value = 0xffffffff; for (const byte of bytes) { value ^= byte; for (let i = 0; i < 8; i++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0); } return (value ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const name = Buffer.from(type); const length = Buffer.alloc(4); length.writeUInt32BE(data.length); const check = Buffer.alloc(4); check.writeUInt32BE(crc(Buffer.concat([name, data]))); return Buffer.concat([length, name, data, check]); }
// Rasterize the existing favicon's simple HL geometry, with safe maskable padding.
for (const [name, size, mask] of [["app-192.png", 192, false], ["app-512.png", 512, false], ["app-maskable-512.png", 512, true], ["apple-touch-icon.png", 180, false]]) {
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const scale = mask ? 0.8 : 1; const px = (x / size * 32 - 16) / scale + 16; const py = (y / size * 32 - 16) / scale + 16;
    const ink = py >= 10 && py < 22 && ((px >= 8 && px < 11) || (px >= 14 && px < 17) || (px >= 11 && px < 14 && py >= 15 && py < 17) || (px >= 19 && px < 22) || (px >= 22 && px < 26 && py >= 19));
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    pixels.set(ink ? [8, 13, 25, 255] : [249, 115, 22, 255], offset);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  writeFileSync(new URL(name, directory), Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", header), chunk("IDAT", deflateSync(pixels)), chunk("IEND", Buffer.alloc(0))]));
}
