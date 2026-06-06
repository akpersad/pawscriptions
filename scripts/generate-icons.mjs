// Dependency-free PNG icon generator for Pawscriptions.
// Draws a teal rounded square with a simple white paw, at the sizes a PWA needs.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

const BG = [13, 148, 136]; // teal-600
const FG = [255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixels /* Uint8Array RGBA */) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // rows with filter byte 0 prefix
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.subarray(y * stride, y * stride + stride).copy
      ? Buffer.from(pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1)
      : raw.set(pixels.subarray(y * stride, y * stride + stride), y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function circle(px, py, r) {
  return (x, y) => (x - px) ** 2 + (y - py) ** 2 <= r * r;
}
function ellipse(px, py, rx, ry) {
  return (x, y) => ((x - px) / rx) ** 2 + ((y - py) / ry) ** 2 <= 1;
}

function draw(size) {
  const px = new Uint8Array(size * size * 4);
  const s = size;
  const r = s * 0.18; // rounded-corner radius
  // paw shapes in unit coords scaled to size
  const pad = ellipse(s * 0.5, s * 0.62, s * 0.2, s * 0.16);
  const toes = [
    circle(s * 0.3, s * 0.42, s * 0.085),
    circle(s * 0.43, s * 0.33, s * 0.09),
    circle(s * 0.57, s * 0.33, s * 0.09),
    circle(s * 0.7, s * 0.42, s * 0.085),
  ];
  const inRounded = (x, y) => {
    // rounded square mask
    if (x >= r && x <= s - r) return y >= 0 && y <= s;
    if (y >= r && y <= s - r) return x >= 0 && x <= s;
    const cx = x < r ? r : s - r;
    const cy = y < r ? r : s - r;
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  };
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const inside = inRounded(x + 0.5, y + 0.5);
      const isPaw = pad(x, y) || toes.some((t) => t(x, y));
      const color = !inside ? [0, 0, 0, 0] : isPaw ? [...FG, 255] : [...BG, 255];
      px[i] = color[0];
      px[i + 1] = color[1];
      px[i + 2] = color[2];
      px[i + 3] = color[3];
    }
  }
  return px;
}

for (const size of [192, 512, 180]) {
  const buf = encodePng(size, draw(size));
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  writeFileSync(join(OUT, name), buf);
  console.log("wrote", name, buf.length, "bytes");
}
