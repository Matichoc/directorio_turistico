"""Dibuja el diablo de Petorca en los fondos de `public/fondos/*.svg`.

El personaje sale de la versión de la leyenda que cuenta la ruta "Donde el
Diablo perdió el poncho" (ver docs/PROPUESTA-CONTENIDO-PETORCA.md): un
forastero de frac negro y diente de oro que bailaba cueca con los mineros y
olvidó el poncho tras una fiesta. Sin casco minero, playa ni dulces (eran de
otras comunas de la provincia).

Reemplaza el grupo del diablo de cada escena (el viejo o uno ya generado,
`<g id="diablo">`) manteniendo su posición y tamaño. También escribe
`public/brand/diablo.svg` (el personaje solo, para revisarlo o usarlo
aparte). Uso: `python scripts/build-scene-devil.py`.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONDOS = ROOT / "public" / "fondos"

# Colores del personaje (paleta del sitio: brasa, noche, oro).
SKIN_TOP, SKIN_BOTTOM = "#ff6b45", "#d23b26"
FRAC, FRAC_DARK, TROUSERS = "#211a2b", "#140f1b", "#2b2336"
SHIRT, GOLD, GOLD_DARK = "#f5efe4", "#f2c44d", "#a8791a"
PONCHO_TOP, PONCHO_BOTTOM = "#d5312f", "#8f1d24"
STRIPE_LIGHT, STRIPE_DARK = "#f1dfc0", "#2b1b1b"
HORN_TOP, HORN_BOTTOM = "#fff1d2", "#c08a4a"
INK = "#1d1016"

DEFS = f"""<defs>
<linearGradient id="dv-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{SKIN_TOP}"/><stop offset="1" stop-color="{SKIN_BOTTOM}"/></linearGradient>
<linearGradient id="dv-horn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{HORN_TOP}"/><stop offset="1" stop-color="{HORN_BOTTOM}"/></linearGradient>
<linearGradient id="dv-poncho" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{PONCHO_TOP}"/><stop offset="1" stop-color="{PONCHO_BOTTOM}"/></linearGradient>
<linearGradient id="dv-frac" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a2f48"/><stop offset=".45" stop-color="{FRAC}"/><stop offset="1" stop-color="{FRAC_DARK}"/></linearGradient>
<radialGradient id="dv-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c4" stop-opacity=".9"/><stop offset=".35" stop-color="#ffd86b" stop-opacity=".4"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
</defs>"""


def head() -> str:
    """Cabeza: cuernos curvos, orejas, pelo engominado, sonrisa con diente de oro."""
    return f"""
<path d="M46 34 C33 31 25 18 29 3 C35 14 46 18 57 24 Z" fill="url(#dv-horn)"/>
<path d="M74 34 C87 31 95 18 91 3 C85 14 74 18 63 24 Z" fill="url(#dv-horn)"/>
<path d="M36 50 C29 44 23 44 20 47 C24 52 29 58 37 60 Z" fill="url(#dv-skin)"/>
<path d="M84 50 C91 44 97 44 100 47 C96 52 91 58 83 60 Z" fill="url(#dv-skin)"/>
<path d="M60 23 C79 23 87 37 86 53 C85 69 73 81 60 81 C47 81 35 69 34 53 C33 37 41 23 60 23 Z" fill="url(#dv-skin)"/>
<path d="M35 46 C35 30 47 21 60 21 C73 21 85 30 85 46 C80 38 72 33 66 33 C63 33 61 37 60 40 C59 37 57 33 54 33 C48 33 40 38 35 46 Z" fill="{INK}"/>
<path d="M44 45 Q50 40 56 44" fill="none" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/>
<path d="M64 44 Q70 40 76 45" fill="none" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/>
<ellipse cx="51" cy="52" rx="4.6" ry="5.4" fill="#fff"/>
<ellipse cx="69" cy="52" rx="4.6" ry="5.4" fill="#fff"/>
<circle cx="52.4" cy="53" r="2.7" fill="{INK}"/>
<circle cx="70.4" cy="53" r="2.7" fill="{INK}"/>
<circle cx="53.3" cy="52" r="1" fill="#fff"/>
<circle cx="71.3" cy="52" r="1" fill="#fff"/>
<ellipse cx="44" cy="62" rx="5" ry="3.2" fill="#ffb199" opacity=".45"/>
<ellipse cx="76" cy="62" rx="5" ry="3.2" fill="#ffb199" opacity=".45"/>
<path d="M57.5 58 Q60 61 62.5 58" fill="none" stroke="#8c2418" stroke-width="2" stroke-linecap="round"/>
<path d="M47 65 Q60 79 73 65 Q60 71 47 65 Z" fill="#5b1a14"/>
<path d="M49.5 66.2 Q60 70.5 70.5 66.2 L70 68.4 Q60 72.2 50 68.4 Z" fill="#fff"/>
<rect x="62.4" y="66.8" width="4.4" height="4.6" rx="1.4" fill="{GOLD}" stroke="{GOLD_DARK}" stroke-width=".6"/>
<path d="M55 79 Q60 91 65 79 Q60 82 55 79 Z" fill="{INK}"/>
"""


def tail() -> str:
    return """
<path d="M76 140 C98 142 106 158 97 170 C90 180 96 190 107 187" fill="none" stroke="#c4272d" stroke-width="4.5" stroke-linecap="round"/>
<path d="M103 185 C103 177 112 174 117 178 C121 183 118 191 109 194 C106 191 103 189 103 185 Z" fill="#c4272d"/>
"""


def body() -> str:
    """Faldones del frac, piernas, zapatos de charol y el frac con humita."""
    return f"""
<path d="M41 136 C38 158 42 175 50 186 C53 170 56 156 60 148 C64 156 67 170 70 186 C78 175 82 158 79 136 Z" fill="{FRAC_DARK}"/>
<path d="M46 144 C46 160 46 176 47 191 L57 191 L59 148 Z" fill="{TROUSERS}"/>
<path d="M61 148 L63 191 L73 191 C74 176 74 160 74 144 Z" fill="{TROUSERS}"/>
<path d="M41 196 C41 189 49 187 57 189 L58 197 C58 200 41 200 41 196 Z" fill="#0d0a10"/>
<path d="M79 196 C79 189 71 187 63 189 L62 197 C62 200 79 200 79 196 Z" fill="#0d0a10"/>
<path d="M45 191 Q49 189 53 190" fill="none" stroke="#fff" stroke-width="1.2" opacity=".35" stroke-linecap="round"/>
<path d="M67 190 Q71 189 75 191" fill="none" stroke="#fff" stroke-width="1.2" opacity=".35" stroke-linecap="round"/>
<path d="M38 98 C38 89 47 85 60 85 C73 85 82 89 82 98 L84 139 C84 146 77 150 60 150 C43 150 36 146 36 139 Z" fill="url(#dv-frac)"/>
<path d="M51 86 L60 120 L69 86 C66 84 54 84 51 86 Z" fill="{SHIRT}"/>
<path d="M51 86 C48 98 52 110 60 120 C55 106 54 96 55 86 Z" fill="#2f2640"/>
<path d="M69 86 C72 98 68 110 60 120 C65 106 66 96 65 86 Z" fill="#2f2640"/>
<path d="M60 92 C55 87 50 89 51 93 C50 97 55 99 60 94 C65 99 70 97 69 93 C70 89 65 87 60 92 Z" fill="#c4272d"/>
<circle cx="60" cy="93" r="1.8" fill="#8f1d24"/>
<circle cx="60" cy="127" r="2" fill="{GOLD}"/>
<circle cx="60" cy="137" r="2" fill="{GOLD}"/>
"""


def poncho() -> str:
    """El poncho resbalando del hombro izquierdo, flameando: el que va a perder."""
    fringe = "".join(
        f'<path d="M{x:.1f} {y:.1f} l{-2.2:.1f} 7" stroke="#e6c690" stroke-width="1.5" stroke-linecap="round"/>'
        for x, y in [
            (13.5, 150.5), (18.5, 151.0), (23.5, 151.8), (28.5, 153.0),
            (33.5, 154.6), (38.5, 156.2),
        ]
    )
    return f"""
<path d="M50 88 C34 88 20 99 12 117 C7 128 8 140 12 149 C22 150 32 153 40 158 C40 140 42 116 54 94 Z" fill="url(#dv-poncho)"/>
<path d="M10.5 136 C21 137 31 140 39.6 145 L39.8 149 C31 144 21 141 10.6 140 Z" fill="{STRIPE_LIGHT}"/>
<path d="M10.6 140 C21 141 31 144 39.8 149 L39.9 152 C31 147 21 144 10.9 143.4 Z" fill="{STRIPE_DARK}"/>
<path d="M10.9 143.4 C21 144 31 147 39.9 152 L40 154.6 C31 150 21 147 11.4 146.4 Z" fill="#e0a73c"/>
<path d="M26 98 C20 106 16 116 14 126" fill="none" stroke="#ff8a6a" stroke-width="1.4" opacity=".35" stroke-linecap="round"/>
<path d="M50 88 C44 94 40 102 38 112" fill="none" stroke="#7a151c" stroke-width="1.6" opacity=".6" stroke-linecap="round"/>
{fringe}
"""


def arm(path: str, hand: tuple[float, float], hand_r: float = 6.5) -> str:
    hx, hy = hand
    return (
        f'<path d="{path}" fill="none" stroke="{FRAC}" stroke-width="11" stroke-linecap="round"/>'
        f'<circle cx="{hx}" cy="{hy}" r="{hand_r}" fill="url(#dv-skin)"/>'
    )


def handkerchief(x: float, y: float) -> str:
    """Pañuelo de cueca, flameando."""
    cloth = (
        f"M{x} {y} C{x + 4} {y - 12} {x + 14} {y - 10} {x + 24} {y - 20} "
        f"C{x + 25} {y - 8} {x + 21} {y - 2} {x + 13} {y + 2} "
        f"C{x + 19} {y + 4} {x + 23} {y + 9} {x + 23} {y + 15} "
        f"C{x + 15} {y + 9} {x + 7} {y + 9} {x} {y + 5} Z"
    )
    fold = f"M{x + 3} {y + 1} C{x + 8} {y - 4} {x + 13} {y - 4} {x + 19} {y - 10}"
    return (
        f'<path d="{cloth}" fill="#fbf7ef" stroke="#d9cfbf" stroke-width=".8"/>'
        f'<path d="{fold}" fill="none" stroke="#d9cfbf" stroke-width="1" stroke-linecap="round"/>'
    )


# Lo que hace con la mano derecha en cada escena (la izquierda va bajo el poncho).
POSES: dict[str, str] = {
    # Cueca: el pañuelo en alto.
    "atardecer": handkerchief(96, 60) + arm("M80 98 Q95 88 96 68", (96, 64)),
    # Arriero: bastón de caminata.
    "cerro": '<path d="M101 42 V204" stroke="#6b4a2a" stroke-width="5" stroke-linecap="round"/>'
    + arm("M80 98 Q96 104 101 116", (101, 118)),
    # Saluda con la mano.
    "pueblo": arm("M80 98 Q97 86 100 70", (100, 65), 7.5),
    # Farol para el túnel de la ruta ferroviaria.
    "tunel": arm("M80 98 Q95 110 97 122", (97, 124))
    + '<path d="M91 131 Q97 124 103 131" fill="none" stroke="#3a3a44" stroke-width="2"/>'
    + '<rect x="90" y="131" width="14" height="18" rx="4" fill="#ffd86b" stroke="#3a3a44" stroke-width="2"/>'
    + '<circle cx="97" cy="140" r="24" fill="url(#dv-glow)"/>',
    # Escenas de la provincia completa (no se usan con solo Petorca): sin props de otras comunas.
    "playa": arm("M80 98 Q95 110 93 124", (93, 126)),
    "dulces": arm("M80 98 Q95 110 93 124", (93, 126)),
}


def devil(pose: str) -> str:
    return "".join(
        [
            DEFS,
            '<ellipse cx="60" cy="201" rx="44" ry="6.5" fill="#000" opacity=".35"/>',
            tail(),
            body(),
            poncho(),
            POSES[pose],
            head(),
        ]
    )


OLD_START = re.compile(r'<g transform="([^"]+)"><ellipse cx="60" cy="201"')
OLD_END = 'url(#lamp)"/></g>'
NEW = re.compile(r'<g id="diablo" transform="([^"]+)">.*?<!--/diablo--></g>', re.S)


def replace_devil(svg: str, pose: str) -> str:
    new = NEW.search(svg)
    if new:
        transform, start, end = new.group(1), new.start(), new.end()
    else:
        old = OLD_START.search(svg)
        if not old:
            raise SystemExit("No encontré el diablo en la escena")
        transform, start = old.group(1), old.start()
        end = svg.index(OLD_END, start) + len(OLD_END)
        # La tabla de surf de la playa iba dentro del grupo viejo: se va con él.
    group = f'<g id="diablo" transform="{transform}">{devil(pose)}<!--/diablo--></g>'
    return svg[:start] + group + svg[end:]


BADGE_DEFS = """<defs>
<radialGradient id="lg-night" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#3b1830"/><stop offset=".55" stop-color="#1b0e1f"/><stop offset="1" stop-color="#07060c"/></radialGradient>
<radialGradient id="lg-ember" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff7a45" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a45" stop-opacity="0"/></radialGradient>
<linearGradient id="lg-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb072"/><stop offset=".5" stop-color="#ff7a45"/><stop offset="1" stop-color="#b8452a"/></linearGradient>
<clipPath id="lg-clip"><circle cx="128" cy="128" r="122"/></clipPath>
</defs>"""

# Cerros del valle detrás del personaje (suaves, como las escenas).
HILLS = (
    '<path d="M0 176 C30 150 58 140 86 152 C112 128 142 118 170 136 C196 120 226 126 256 146 V256 H0 Z" fill="#3a1f55"/>'
    '<path d="M0 204 C34 184 66 180 98 194 C128 178 162 174 192 188 C214 180 236 182 256 192 V256 H0 Z" fill="#221a45"/>'
)
STARS = "".join(
    f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" opacity="{o}"/>'
    for x, y, r, o in [
        (52, 70, 1.6, 0.8), (74, 42, 1.1, 0.6), (196, 52, 1.4, 0.75),
        (214, 88, 1, 0.55), (40, 112, 1, 0.5), (182, 30, 1, 0.5),
    ]
)


def logo_svg() -> str:
    """Insignia: el diablo de busto, con el pañuelo en alto, sobre los cerros de noche."""
    figure = "".join([DEFS, body(), poncho(), POSES["atardecer"], head()])
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">'
        + BADGE_DEFS
        + '<circle cx="128" cy="128" r="124" fill="url(#lg-night)"/>'
        + '<g clip-path="url(#lg-clip)">'
        + STARS
        + '<circle cx="124" cy="104" r="96" fill="url(#lg-ember)"/>'
        + HILLS
        + f'<g transform="translate(10 18) scale(1.95)">{figure}</g>'
        + "</g>"
        + '<circle cx="128" cy="128" r="123" fill="none" stroke="url(#lg-ring)" stroke-width="6"/>'
        + "</svg>\n"
    )


def favicon_svg() -> str:
    """Ícono chico (pestaña del navegador): solo la cabeza sobre fondo de noche."""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        + BADGE_DEFS
        + '<rect width="64" height="64" rx="14" fill="url(#lg-night)"/>'
        + '<circle cx="32" cy="34" r="26" fill="url(#lg-ember)"/>'
        + f'<g transform="translate(-7.6 1.5) scale(0.66)">{DEFS}{head()}</g>'
        + "</svg>\n"
    )


def main() -> None:
    brand = ROOT / "public" / "brand"
    for name, svg in [("logo.svg", logo_svg()), ("icono.svg", favicon_svg())]:
        (brand / name).write_text(svg, encoding="utf-8")
        print("ok", (brand / name).relative_to(ROOT))
    for pose in POSES:
        path = FONDOS / f"{pose}.svg"
        path.write_text(replace_devil(path.read_text(encoding="utf-8"), pose), encoding="utf-8")
        print("ok", path.relative_to(ROOT))
    solo = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -4 124 210">'
        + devil("atardecer")
        + "</svg>\n"
    )
    out = ROOT / "public" / "brand" / "diablo.svg"
    out.write_text(solo, encoding="utf-8")
    print("ok", out.relative_to(ROOT))


if __name__ == "__main__":
    main()
