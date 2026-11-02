import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getSiteUrl, localizedPath } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Panel, APIs (proxies de Google con costo por llamada) y la página
      // personal de cada visitante no tienen nada que indexar.
      // "Mi recorrido" es de cada persona: fuera del índice en todos los
      // idiomas (antes faltaba /pt/meu-roteiro).
      disallow: [
        "/admin",
        "/api/",
        ...routing.locales.map((locale) => localizedPath("/recorrido", locale)),
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
