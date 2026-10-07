"""
Genera las teselas de relieve que usa el vuelo 3D del home
(`ProvinceFlyover`, ver docs/DESIGN.md) en `public/terrain/{z}/{x}/{y}.webp`.

Por qué servirlas desde el propio sitio en vez de directo desde AWS: el bucket
público de AWS (Terrain Tiles, formato Terrarium) está en EE.UU. y solo habla
HTTP/1.1 — desde Chile cada tesela tardaba ~0,5 s y el navegador las pedía de
a 6, así que el relieve llegaba tarde y el vuelo mostraba manchas sin detalle.
Desde Vercel salen de la caché en Sudamérica, por HTTP/2 y cacheadas para
siempre. Se convierten a WebP **sin pérdida** (~40 % menos peso): el relieve
va codificado en los colores de cada píxel, así que cualquier pérdida
cambiaría las alturas.

Cobertura: la provincia completa con detalle (zoom 11-12) y, con menos
detalle, un margen amplio hasta la cordillera y el mar (zoom 5-10), para que
el horizonte del vuelo no quede cortado.

Uso (requiere Python 3 y `pip install pillow`):
    python scripts/build-terrain-tiles.py
Fuente de los datos: https://registry.opendata.aws/terrain-tiles/ (atribución
en el propio mapa).
"""

import concurrent.futures as cf
import io
import math
import os
import urllib.request

from PIL import Image

SOURCE = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "terrain")

# (zoom mínimo, zoom máximo, [lat sur, lat norte, lng oeste, lng este])
COVERAGE = [
    (5, 9, (-33.5, -31.5, -72.2, -69.8)),  # región: mar y cordillera
    (10, 10, (-33.3, -31.6, -72.0, -69.9)),  # horizonte del vuelo
    (11, 12, (-32.85, -31.95, -71.65, -70.45)),  # la provincia, con detalle
]


def tile(lat, lng, z):
    n = 2**z
    x = int((lng + 180) / 360 * n)
    lat_r = math.radians(lat)
    y = int((1 - math.log(math.tan(lat_r) + 1 / math.cos(lat_r)) / math.pi) / 2 * n)
    return x, y


def jobs():
    for zmin, zmax, (south, north, west, east) in COVERAGE:
        for z in range(zmin, zmax + 1):
            x0, y0 = tile(north, west, z)
            x1, y1 = tile(south, east, z)
            for x in range(x0, x1 + 1):
                for y in range(y0, y1 + 1):
                    yield z, x, y


def build(job):
    z, x, y = job
    path = os.path.join(OUT, str(z), str(x), f"{y}.webp")
    if os.path.exists(path):
        return 0
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with urllib.request.urlopen(SOURCE.format(z=z, x=x, y=y), timeout=30) as res:
        image = Image.open(io.BytesIO(res.read())).convert("RGB")
    image.save(path, "WEBP", lossless=True, quality=100, method=4)
    return 1


if __name__ == "__main__":
    unique = sorted(set(jobs()))
    with cf.ThreadPoolExecutor(8) as pool:
        created = sum(pool.map(build, unique))
    print(f"{len(unique)} teselas ({created} nuevas) en public/terrain")
