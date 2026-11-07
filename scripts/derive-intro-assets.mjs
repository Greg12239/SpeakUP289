/** Lossless pixel separation, never a redraw. Run from the application directory. */
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const directory = new URL("../public/brand/", import.meta.url);
const sources = {
  primary: new URL("speakup-primary.png", directory),
  light: new URL("speakup-wordmark-light.png", directory),
};
const { data: primary, info } = await sharp(await readFile(sources.primary)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const light = await sharp(await readFile(sources.light)).ensureAlpha().raw().toBuffer();
const isRed = (pixels, i) => pixels[i] > 150 && pixels[i + 1] < 80 && pixels[i + 2] < 130;
const layers = {};

for (const name of ["wordmark", "arrow", "signature"]) {
  const pixels = Buffer.alloc(primary.length);
  let left = info.width, top = info.height, right = 0, bottom = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      const source = name === "wordmark" ? light : primary;
      const keep = name === "signature" ? y >= 300 : y < 270 && (name === "arrow" ? isRed(source, i) : !isRed(source, i));
      if (!keep || !source[i + 3]) continue;
      source.copy(pixels, i, i, i + 4);
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x); bottom = Math.max(bottom, y);
    }
  }
  const bounds = { left, top, width: right - left + 1, height: bottom - top + 1 };
  await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract(bounds).png({ compressionLevel: 9 }).toFile(fileURLToPath(new URL(`speakup-intro-${name}.png`, directory)));
  layers[name] = bounds;
}

const hashes = {};
for (const [name, path] of Object.entries(sources)) hashes[name] = createHash("sha256").update(await readFile(path)).digest("hex");
const manifest = { coordinateSystem: [1250, 370], sources: { primary: "speakup-primary.png", light: "speakup-wordmark-light.png" }, sha256: hashes, layers };
await writeFile(new URL("speakup-intro-provenance.json", directory), JSON.stringify(manifest, null, 2) + "\n");
console.log(manifest);
