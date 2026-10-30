// Builds web-ready images and data/photos.json from the originals in photos/<category>/.
//
//   npm install        (once)
//   npm run photos     (after adding, removing or renaming photos)
//
// For every original it writes media/<category>/<id>-{480,960,1920}.webp (auto-rotated, metadata
// stripped) and records its size, a placeholder color, a title from data/titles.json and the camera
// settings read from EXIF. Unchanged photos are skipped, so re-running is fast.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import exifReader from "exif-reader";

const root = process.env.SITE_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "photos");
const OUT = path.join(root, "media");
const DATA = path.join(root, "data");
const WIDTHS = [480, 960, 1920];
const CATEGORIES = ["cars", "landscapes", "animals", "shoots", "misc", "awards"];
const IMAGE = /\.(jpe?g|png|webp|tiff?)$/i;
const OG_SOURCE = ["cars", "car10.jpg"]; // social preview image

const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true });
const slug = (file) => path.parse(file).name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const hex = ({ r, g, b }) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

const titlesFile = path.join(DATA, "titles.json");
const titles = fs.existsSync(titlesFile) ? JSON.parse(fs.readFileSync(titlesFile, "utf8")) : {};

function shutter(t) {
  if (!t) return undefined;
  return t >= 0.3 ? round(t, 1) + "s" : "1/" + Math.round(1 / t) + "s";
}

function lensName(lens) {
  return String(lens).replace(/\s+/g, " ").trim();
}

function readExif(meta) {
  if (!meta.exif) return {};
  let e;
  try { e = exifReader(meta.exif); } catch { return {}; }
  const p = e.Photo || {};
  const img = e.Image || {};
  const out = {};
  if (img.Model) out.camera = String(img.Model).trim();
  if (p.LensModel) out.lens = lensName(p.LensModel);
  if (p.FocalLength) out.focal = Math.round(p.FocalLength) + "mm";
  if (p.FNumber) out.aperture = "f/" + round(p.FNumber, 1);
  if (p.ExposureTime) out.shutter = shutter(p.ExposureTime);
  const iso = p.ISOSpeedRatings || p.PhotographicSensitivity;
  if (iso) out.iso = Array.isArray(iso) ? iso[0] : iso;
  if (p.DateTimeOriginal instanceof Date && !isNaN(p.DateTimeOriginal)) out.date = p.DateTimeOriginal.toISOString().slice(0, 10);
  return out;
}

async function processPhoto(category, file, id, input = path.join(SRC, category, file)) {
  const dir = path.join(OUT, category);
  fs.mkdirSync(dir, { recursive: true });

  const meta = await sharp(input).metadata();
  const swap = (meta.orientation || 1) >= 5;
  const width = swap ? meta.height : meta.width;
  const height = swap ? meta.width : meta.height;
  const srcTime = fs.statSync(input).mtimeMs;

  // Only make sizes the original can fill; the smallest is always made.
  const sizes = WIDTHS.filter((w, i) => i === 0 || w <= width * 1.15);
  // Small originals also get a copy at their full width so the lightbox isn't stuck at 480px.
  const top = sizes[sizes.length - 1];
  if (top < WIDTHS[WIDTHS.length - 1] && width - top > 120) sizes.push(width);

  for (const w of sizes) {
    const target = path.join(dir, `${id}-${w}.webp`);
    if (fs.existsSync(target) && fs.statSync(target).mtimeMs > srcTime) continue;
    await sharp(input).rotate().resize({ width: Math.min(w, width), withoutEnlargement: true })
      .webp({ quality: w <= 480 ? 72 : 80, effort: 5 }).toFile(target);
  }

  const { dominant } = await sharp(input).rotate().resize(64).stats();
  const photo = { id, file, w: width, h: height, color: hex(dominant), sizes, ...readExif(meta) };
  const title = titles[`${category}/${id}`];
  if (title) photo.title = title;
  return photo;
}

const data = { generated: new Date().toISOString(), categories: {} };
let count = 0;

for (const category of CATEGORIES) {
  const folder = path.join(SRC, category);
  const files = fs.existsSync(folder) ? fs.readdirSync(folder).filter((f) => IMAGE.test(f)).sort(natural) : [];
  data.categories[category] = [];
  const taken = new Set();
  for (const file of files) {
    let id = slug(file);
    if (taken.has(id)) id += "-" + path.extname(file).slice(1).toLowerCase();
    taken.add(id);
    process.stdout.write(`\r${category}/${file}`.padEnd(60));
    data.categories[category].push(await processPhoto(category, file, id));
    count++;
  }
}

// The About page portrait lives outside the gallery categories.
const portrait = path.join(SRC, "pfpfp.jpg");
if (fs.existsSync(portrait)) data.portrait = await processPhoto("site", "pfpfp.jpg", "portrait", portrait);

// Social preview (1200 x 630 JPEG, since not every platform reads WebP).
const og = path.join(OUT, "site", "og.jpg");
const ogSource = path.join(SRC, ...OG_SOURCE);
if (fs.existsSync(ogSource) && (!fs.existsSync(og) || fs.statSync(og).mtimeMs < fs.statSync(ogSource).mtimeMs)) {
  await sharp(ogSource).rotate().resize(1200, 630, { fit: "cover", position: "attention" }).jpeg({ quality: 82 }).toFile(og);
}

// Remove derivatives whose original no longer exists.
for (const category of CATEGORIES) {
  const dir = path.join(OUT, category);
  if (!fs.existsSync(dir)) continue;
  const keep = new Set(data.categories[category].map((p) => p.id));
  for (const f of fs.readdirSync(dir)) {
    if (!keep.has(f.replace(/-\d+\.webp$/, ""))) fs.unlinkSync(path.join(dir, f));
  }
}

fs.mkdirSync(DATA, { recursive: true });
fs.writeFileSync(path.join(DATA, "photos.json"), JSON.stringify(data, null, 1) + "\n");
console.log(`\rBuilt ${count} photos into media/ and data/photos.json`.padEnd(60));
