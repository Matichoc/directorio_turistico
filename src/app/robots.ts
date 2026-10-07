import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Panel, APIs (proxies de Google con costo por llamada) y la página
      // personal de cada visitante no tienen nada que indexar.
      disallow: ["/admin", "/api/", "/es/recorrido", "/en/my-trip"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
