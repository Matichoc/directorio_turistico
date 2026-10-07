import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { listPlaces } from "@/lib/data/places";
import { listRoutes } from "@/lib/data/routes";
import { listLocalities } from "@/lib/data/localities";
import { getSiteUrl, localizedPath } from "@/lib/seo";

type Href = Parameters<typeof localizedPath>[0];

/**
 * Un `<url>` por página pública y por idioma, cada uno con sus
 * alternativas (hreflang). Los slugs son los mismos en ambos idiomas, así
 * que el catálogo se lee una sola vez (en español). `/recorrido` queda
 * fuera a propósito: es personal de cada visitante.
 */
// El catálogo cambia desde el admin: nunca congelarlo en el build.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const [places, routes, localities] = await Promise.all([
    listPlaces("es"),
    listRoutes("es"),
    listLocalities("es"),
  ]);

  const hrefs: { href: Href; priority: number }[] = [
    { href: "/", priority: 1 },
    { href: "/explorar", priority: 0.9 },
    { href: "/rutas", priority: 0.8 },
    { href: "/informacion", priority: 0.4 },
    { href: "/privacidad", priority: 0.2 },
    ...routes.map((route) => ({
      href: {
        pathname: "/rutas/[slug]",
        params: { slug: route.slug },
      } as Href,
      priority: 0.7,
    })),
    ...localities.map((locality) => ({
      href: {
        pathname: "/pueblos/[slug]",
        params: { slug: locality.slug },
      } as Href,
      priority: 0.6,
    })),
    ...places.map((place) => ({
      href: {
        pathname: "/lugares/[slug]",
        params: { slug: place.slug },
      } as Href,
      priority: 0.7,
    })),
  ];

  return hrefs.flatMap(({ href, priority }) =>
    routing.locales.map((locale) => ({
      url: `${base}${localizedPath(href, locale)}`,
      changeFrequency: "weekly" as const,
      priority,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((alt) => [
            alt,
            `${base}${localizedPath(href, alt)}`,
          ]),
        ),
      },
    })),
  );
}
