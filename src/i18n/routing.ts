import { defineRouting } from "next-intl/routing";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/explorar": {
      es: "/explorar",
      en: "/explore",
    },
    "/rutas": {
      es: "/rutas",
      en: "/routes",
    },
    "/rutas/[slug]": {
      es: "/rutas/[slug]",
      en: "/routes/[slug]",
    },
    "/lugares": {
      es: "/lugares",
      en: "/places",
    },
    "/lugares/[slug]": {
      es: "/lugares/[slug]",
      en: "/places/[slug]",
    },
    "/recorrido": {
      es: "/recorrido",
      en: "/my-trip",
    },
    "/informacion": {
      es: "/informacion",
      en: "/info",
    },
  },
});
