// Integra el arte final del diablo de Petorca (hecho con GPT según
// docs/PROMPTS-IMAGENES.md; personaje aprobado en
// docs/arte/diablo-referencia-aprobada.png).
//
//   node scripts/build-brand-png.mjs --check   → solo dice qué falta y qué no cumple
//   node scripts/build-brand-png.mjs           → convierte lo que esté listo
//
// Cada recurso se procesa solo si su PNG existe y cumple (tamaño, y
// transparencia cuando corresponde): nunca pisa una imagen del proyecto con
// algo que falta o es un borrador. Los íconos del sitio (favicon, app,
// compartir) se arman desde `icono.png` (ver más abajo). Conectar
// el arte al sitio (fondos, portadas, logo en la barra) es un paso aparte,
// después de revisarlo a la vista: ver "Integración" en docs/PROMPTS-IMAGENES.md.
// Usa `sharp`, que viene con Next.
import { existsSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const CHECK_ONLY = process.argv.includes("--check");

const NIGHT = "#07060c";

/** Lo que falta generar (mismo listado que docs/PROMPTS-IMAGENES.md). */
const ASSETS = [
  { src: "public/brand/logo.png", size: [1024, 1024], transparent: true },
  { src: "public/brand/icono.png", size: [1024, 1024] },
  { src: "public/fondos/atardecer.png", size: [1536, 1024], webp: true },
  { src: "public/fondos/cerro.png", size: [1536, 1024], webp: true },
  { src: "public/fondos/pueblo.png", size: [1536, 1024], webp: true },
  { src: "public/fondos/tunel.png", size: [1536, 1024], webp: true },
  {
    src: "public/rutas/ruta-del-diablo-pedegua-chincolco-campesino.png",
    size: [1536, 1024],
    webp: true,
  },
  {
    src: "public/rutas/ruta-ferroviaria-pedegua-las-palmas.png",
    size: [1536, 1024],
    webp: true,
  },
  // Escenas de la leyenda (entrega del 2026-11-02, diablo campesino).
  {
    src: "public/leyendas/diablo-buscando.png",
    size: [1254, 1254],
    transparent: true,
    webp: true,
    optional: true,
  },
  {
    src: "public/leyendas/cueca.png",
    size: [1536, 1024],
    webp: true,
    optional: true,
  },
  {
    src: "public/leyendas/ano-nuevo.png",
    size: [1536, 1024],
    webp: true,
    optional: true,
  },
  {
    src: "public/leyendas/escalera.png",
    size: [1536, 1024],
    webp: true,
    optional: true,
  },
  // Pedidas el 2026-11-02 ("Pendientes" en docs/PROMPTS-IMAGENES.md): hoy
  // gastronomía y cultura repiten el pueblo, y naturaleza y recreación el
  // cerro. Al llegar, conectarlas (SCENE_SRC, ART_POSITION).
  {
    src: "public/fondos/cocina.png",
    size: [1536, 1024],
    webp: true,
    optional: true,
  },
  {
    src: "public/fondos/descanso.png",
    size: [1536, 1024],
    webp: true,
    optional: true,
  },
  {
    src: "public/fondos/plaza.png",
    size: [1536, 1024],
    webp: true,
    optional: true,
  },
  {
    src: "public/eventos/cocinando-con-el-diablo.png",
    size: [1536, 1024],
    webp: true,
    optional: true,
  },
];

/** ¿Las cuatro esquinas son transparentes? (un "transparente" falso trae fondo pintado) */
async function cornersTransparent(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alphaAt = (x, y) => data[(y * info.width + x) * info.channels + 3];
  const w = info.width - 1;
  const h = info.height - 1;
  return [alphaAt(0, 0), alphaAt(w, 0), alphaAt(0, h), alphaAt(w, h)].every(
    (a) => a < 16,
  );
}

async function review(asset) {
  const file = join(ROOT, asset.src);
  if (!existsSync(file)) {
    return { ...asset, file, status: asset.optional ? "opcional" : "falta" };
  }
  const meta = await sharp(file).metadata();
  const problems = [];
  if (meta.width !== asset.size[0] || meta.height !== asset.size[1]) {
    problems.push(
      `mide ${meta.width}×${meta.height}, se esperaba ${asset.size.join("×")}`,
    );
  }
  if (asset.transparent && !(await cornersTransparent(file))) {
    problems.push("no tiene fondo transparente");
  }
  return {
    ...asset,
    file,
    status: problems.length ? "revisar" : "listo",
    problems,
  };
}

const reviewed = await Promise.all(ASSETS.map(review));
for (const a of reviewed) {
  const icon = { listo: "✔", revisar: "✖", falta: "·", opcional: "·" }[
    a.status
  ];
  console.log(`${icon} ${a.status.padEnd(8)} ${a.src}`);
  for (const p of a.problems ?? []) console.log(`             ${p}`);
}
const ready = (src) => reviewed.find((a) => a.src === src)?.status === "listo";

if (CHECK_ONLY) process.exit(0);

const out = (path, data) => {
  writeFileSync(join(ROOT, path), data);
  console.log("  →", path);
};

// Fondos, portadas y el diablo buscando: PNG → WebP al lado (el PNG original
// no se sube al repo, ver .gitignore).
for (const a of reviewed.filter((a) => a.webp && a.status === "listo")) {
  const target = a.src.replace(/\.png$/, ".webp");
  out(target, await sharp(a.file).webp({ quality: 82 }).toBuffer());
}

// Desde 2026-11-02 todos los íconos (favicon, app, barra, compartir) salen
// de `icono.png`, la cara del diablo campesino: a tamaño ícono se lee mejor
// que el logo. El logo con el nombre (`logo.png`, 2026-11-03) se revisa acá
// pero no entra en los íconos.
if (!ready("public/brand/icono.png")) {
  console.log("\nÍconos del sitio sin tocar: falta icono.png definitivo.");
  process.exit(0);
}

const icono = join(ROOT, "public/brand/icono.png");
// Paleta: el ícono es una ilustración con mucho detalle y sin ella el de
// 512 px pesaba ~500 KB (se baja en cada visita y en la caché sin señal).
// Solo para los íconos de `public/`: los de `src/app/` (favicon.ico, icon,
// apple-icon) los procesa Next y exige PNG RGBA, sin paleta (si no, el build
// y el servidor de desarrollo fallan con "The PNG is not in RGBA format").
const SMALL_PNG = { palette: true, quality: 90, compressionLevel: 9 };

const png = (image, size, options = {}) =>
  sharp(image)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .png(options)
    .toBuffer();

/** El ícono recortado en círculo (barra del sitio, imagen para compartir). */
async function round(size) {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`,
  );
  return sharp(await png(icono, size))
    .composite([{ input: mask, blend: "dest-in" }])
    .png(SMALL_PNG)
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

out(
  "src/app/favicon.ico",
  ico(
    await Promise.all(
      [16, 32, 48].map(async (size) => ({
        size,
        data: await png(icono, size),
      })),
    ),
  ),
);
out("src/app/icon.png", await png(icono, 192));
out("src/app/apple-icon.png", await png(icono, 180));
out("public/icons/icon-192.png", await round(192));
out("public/icons/icon-512.png", await round(512));
// Android recorta los íconos "maskable" en círculo o gota: el ícono es un
// cuadrado lleno con la cara al centro, dentro de la zona segura (80 %).
out("public/icons/icon-maskable-512.png", await png(icono, 512, SMALL_PNG));

// Imagen para compartir (1200×630): el diablo y el nombre sobre la noche.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><radialGradient id="bg" cx=".3" cy=".45" r=".8"><stop offset="0" stop-color="#3b1830"/><stop offset=".5" stop-color="#1b0e1f"/><stop offset="1" stop-color="${NIGHT}"/></radialGradient>
<linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb072"/><stop offset="1" stop-color="#ff7a45"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<text x="560" y="270" font-family="Georgia" font-weight="700" font-size="84" fill="#ecebf6">El diablo</text>
<text x="560" y="368" font-family="Georgia" font-weight="700" font-size="84" fill="url(#t)">en Petorca</text>
<text x="562" y="430" font-family="Georgia" font-size="30" fill="#ecebf6" fill-opacity=".75">Rutas, pueblos y leyendas de la comuna</text>
</svg>`;
out(
  "public/brand/og.png",
  await sharp(Buffer.from(og))
    .composite([{ input: await round(420), left: 90, top: 105 }])
    .png()
    .toBuffer(),
);
console.log(
  "\nListo. Falta conectarlo al sitio y revisarlo: docs/PROMPTS-IMAGENES.md, Integración.",
);
