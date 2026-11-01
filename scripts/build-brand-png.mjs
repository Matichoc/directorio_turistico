// Genera los íconos del sitio a partir del logo (public/brand/): favicon,
// ícono de pestaña, ícono de Apple, íconos de la app instalable y la imagen
// para compartir. Usa `logo.png`/`icono.png` si existen (arte final, p. ej.
// hecho con GPT: ver docs/PROMPTS-IMAGENES.md); si no, `logo.svg`/`icono.svg`
// (provisorios, de scripts/build-scene-devil.py).
// Uso: node scripts/build-brand-png.mjs (usa `sharp`, que viene con Next).
import {
  copyFileSync,
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");

const NIGHT = "#07060c";
const brand = (name) => {
  const raster = join(ROOT, `public/brand/${name}.png`);
  return existsSync(raster)
    ? { file: raster, raster: true }
    : { file: join(ROOT, `public/brand/${name}.svg`), raster: false };
};
const logoSrc = brand("logo");
const iconoSrc = brand("icono");
const logo = readFileSync(logoSrc.file);
const icono = readFileSync(iconoSrc.file);
console.log("logo:", logoSrc.file, "· ícono:", iconoSrc.file);

const png = (image, size) =>
  sharp(image, { density: 384 })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

/** El logo centrado sobre un cuadrado de noche (`scale` = cuánto ocupa). */
async function onNight(size, scale) {
  const inner = Math.round(size * scale);
  return sharp({
    create: { width: size, height: size, channels: 4, background: NIGHT },
  })
    .composite([{ input: await png(logo, inner), gravity: "centre" }])
    .png()
    .toBuffer();
}

/** .ico con imágenes PNG adentro (lo aceptan todos los navegadores). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size % 256, entry);
    header.writeUInt8(size % 256, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

const out = (path, data) => {
  writeFileSync(join(ROOT, path), data);
  console.log("ok", path);
};

const sizes = [16, 32, 48];
out(
  "src/app/favicon.ico",
  ico(
    await Promise.all(
      sizes.map(async (size) => ({ size, data: await png(icono, size) })),
    ),
  ),
);
// Ícono de pestaña moderno: SVG si el ícono es vectorial, si no PNG.
if (iconoSrc.raster) {
  rmSync(join(ROOT, "src/app/icon.svg"), { force: true });
  out("src/app/icon.png", await png(icono, 192));
} else {
  rmSync(join(ROOT, "src/app/icon.png"), { force: true });
  copyFileSync(iconoSrc.file, join(ROOT, "src/app/icon.svg"));
  console.log("ok src/app/icon.svg");
}
out("src/app/apple-icon.png", await onNight(180, 0.9));
out("public/icons/icon-192.png", await png(logo, 192));
out("public/icons/icon-512.png", await png(logo, 512));
// Android recorta los íconos "maskable" en círculo o gota: el logo dentro de
// la zona segura (80 % central).
out("public/icons/icon-maskable-512.png", await onNight(512, 0.78));

// Imagen para compartir (1200×630): el logo y el nombre sobre la noche.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><radialGradient id="bg" cx=".3" cy=".45" r=".8"><stop offset="0" stop-color="#3b1830"/><stop offset=".5" stop-color="#1b0e1f"/><stop offset="1" stop-color="${NIGHT}"/></radialGradient>
<linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb072"/><stop offset="1" stop-color="#ff7a45"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<path d="M0 560 C160 520 300 512 440 540 C600 500 760 492 920 526 C1040 508 1130 512 1200 528 V630 H0 Z" fill="#221a45"/>
<text x="560" y="270" font-family="Georgia" font-weight="700" font-size="84" fill="#ecebf6">El diablo</text>
<text x="560" y="368" font-family="Georgia" font-weight="700" font-size="84" fill="url(#t)">en Petorca</text>
<text x="562" y="430" font-family="Georgia" font-size="30" fill="#ecebf6" fill-opacity=".75">Rutas, pueblos y leyendas de la comuna</text>
</svg>`;
out(
  "public/brand/og.png",
  await sharp(Buffer.from(og))
    .composite([{ input: await png(logo, 420), left: 90, top: 105 }])
    .png()
    .toBuffer(),
);
