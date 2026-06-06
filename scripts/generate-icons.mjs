// Dependency-free icon generator for Pawscriptions.
// Renders the brand mark (a tri-color mini-Aussie paw on a warm copper tile)
// to the PNGs a PWA needs, plus a favicon (.ico + .svg). The geometry mirrors
// the <PawMark/> React component in src/components/PawMark.tsx.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ICONS = join(ROOT, "public", "icons");
const PUBLIC = join(ROOT, "public");
const APP = join(ROOT, "src", "app");
mkdirSync(ICONS, { recursive: true });

// ---- Brand colors (sRGB, same family as the CSS copper accent) -------------
const COPPER_LIGHT = [199, 127, 74]; // top-left of tile gradient
const COPPER_DEEP = [124, 67, 38]; // bottom-right of tile gradient
const GLINT = [240, 199, 148]; // soft amber highlight
const CREAM = [250, 242, 230]; // the paw

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c0, c1, t) => [lerp(c0[0], c1[0], t), lerp(c0[1], c1[1], t), lerp(c0[2], c1[2], t)];

// ---- PNG encoding ----------------------------------------------------------
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
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
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
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

// ---- Geometry (normalized 0..1, matches PawMark) ---------------------------
// Returns 1 if inside the paw at (u,v), else 0.
const TOES = [
  { cx: 0.3, cy: 0.4, rx: 0.085, ry: 0.11, rot: -20 },
  { cx: 0.435, cy: 0.3, rx: 0.09, ry: 0.12, rot: -7 },
  { cx: 0.565, cy: 0.3, rx: 0.09, ry: 0.12, rot: 7 },
  { cx: 0.7, cy: 0.4, rx: 0.085, ry: 0.11, rot: 20 },
];
const PAD = { cx: 0.5, cy: 0.62, rx: 0.2, ry: 0.165 };

function inEllipse(u, v, e) {
  const a = ((e.rot ?? 0) * Math.PI) / 180;
  const dx = u - e.cx;
  const dy = v - e.cy;
  const rxp = dx * Math.cos(a) + dy * Math.sin(a);
  const ryp = -dx * Math.sin(a) + dy * Math.cos(a);
  return (rxp / e.rx) ** 2 + (ryp / e.ry) ** 2 <= 1;
}
function inPaw(u, v) {
  if (inEllipse(u, v, PAD)) return true;
  for (const t of TOES) if (inEllipse(u, v, t)) return true;
  return false;
}
// Rounded-square mask in normalized space (radius r as fraction).
function inRounded(u, v, r) {
  if (u >= r && u <= 1 - r) return v >= 0 && v <= 1;
  if (v >= r && v <= 1 - r) return u >= 0 && u <= 1;
  const cx = u < r ? r : 1 - r;
  const cy = v < r ? r : 1 - r;
  return (u - cx) ** 2 + (v - cy) ** 2 <= r * r;
}

// ---- Render one icon -------------------------------------------------------
// opts.bleed: full-bleed square (maskable / apple); else rounded tile.
// opts.pawScale: paw size as a fraction of the canvas (centered).
function draw(size, { bleed = false, pawScale = 0.66 } = {}) {
  const px = new Uint8Array(size * size * 4);
  const SS = 3; // supersampling per axis for smooth edges
  const radius = 0.24; // rounded-tile corner radius (fraction)
  // Map paw space (0..1) into a centered box of side pawScale.
  const pawOrigin = (1 - pawScale) / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / size;
          const v = (y + (sy + 0.5) / SS) / size;
          const onTile = bleed ? true : inRounded(u, v, radius);
          if (!onTile) continue;
          // Paw coords within the centered paw box.
          const pu = (u - pawOrigin) / pawScale;
          const pv = (v - pawOrigin) / pawScale;
          let col;
          if (pu >= 0 && pu <= 1 && pv >= 0 && pv <= 1 && inPaw(pu, pv)) {
            col = CREAM;
          } else {
            // tile gradient (diagonal) + soft top-left amber glint
            const t = Math.min(1, Math.max(0, (u + v) / 2));
            col = mix(COPPER_LIGHT, COPPER_DEEP, t);
            const gd = Math.hypot(u - 0.3, v - 0.24);
            const glow = Math.max(0, 1 - gd / 0.7) * 0.5;
            col = mix(col, GLINT, glow);
          }
          r += col[0]; g += col[1]; b += col[2]; a += 255;
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      px[i] = Math.round(r / n);
      px[i + 1] = Math.round(g / n);
      px[i + 2] = Math.round(b / n);
      px[i + 3] = Math.round(a / n);
    }
  }
  return px;
}

// ---- ICO (wraps a 32px PNG; modern .ico supports embedded PNG) -------------
function encodeIco(pngBuf, dim) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // count
  const entry = Buffer.alloc(16);
  entry[0] = dim >= 256 ? 0 : dim; // width
  entry[1] = dim >= 256 ? 0 : dim; // height
  entry[2] = 0; // palette
  entry[3] = 0; // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(pngBuf.length, 8); // size
  entry.writeUInt32LE(22, 12); // offset (6 + 16)
  return Buffer.concat([header, entry, pngBuf]);
}

// ---- SVG favicon (crisp at any size) ---------------------------------------
function svgFavicon() {
  const toe = (e) =>
    `<ellipse cx="${e.cx * 100}" cy="${e.cy * 100}" rx="${e.rx * 100}" ry="${e.ry * 100}" transform="rotate(${e.rot} ${e.cx * 100} ${e.cy * 100})"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="t" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#C77F4A"/><stop offset="1" stop-color="#7C4326"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="24" fill="url(#t)"/>
  <g fill="#FAF2E6">
    ${TOES.map(toe).join("\n    ")}
    <ellipse cx="${PAD.cx * 100}" cy="${PAD.cy * 100}" rx="${PAD.rx * 100}" ry="${PAD.ry * 100}"/>
  </g>
</svg>
`;
}

// ---- Emit ------------------------------------------------------------------
const outputs = [
  ["public/icons/icon-192.png", encodePng(192, draw(192, { pawScale: 0.66 }))],
  ["public/icons/icon-512.png", encodePng(512, draw(512, { pawScale: 0.66 }))],
  ["public/icons/icon-512-maskable.png", encodePng(512, draw(512, { bleed: true, pawScale: 0.56 }))],
  ["public/icons/apple-touch-icon.png", encodePng(180, draw(180, { bleed: true, pawScale: 0.62 }))],
];
for (const [rel, buf] of outputs) {
  writeFileSync(join(ROOT, rel), buf);
  console.log("wrote", rel, buf.length, "bytes");
}

const favPng = encodePng(32, draw(32, { pawScale: 0.7 }));
writeFileSync(join(APP, "favicon.ico"), encodeIco(favPng, 32));
console.log("wrote src/app/favicon.ico");
writeFileSync(join(PUBLIC, "favicon.svg"), svgFavicon());
console.log("wrote public/favicon.svg");
