import { defineRouting } from "next-intl/routing";

export const locales = ["es", "en", "pt"] as const;
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
      pt: "/explorar",
    },
    "/rutas": {
      es: "/rutas",
      en: "/routes",
      pt: "/rotas",
    },
    "/rutas/[slug]": {
      es: "/rutas/[slug]",
      en: "/routes/[slug]",
      pt: "/rotas/[slug]",
    },
    "/lugares": {
      es: "/lugares",
      en: "/places",
      pt: "/lugares",
    },
    "/lugares/[slug]": {
      es: "/lugares/[slug]",
      en: "/places/[slug]",
      pt: "/lugares/[slug]",
    },
    "/recorrido": {
      es: "/recorrido",
      en: "/my-trip",
      pt: "/meu-roteiro",
    },
    "/recorrido/compartido": {
      es: "/recorrido/compartido",
      en: "/my-trip/shared",
      pt: "/meu-roteiro/compartilhado",
    },
    "/informacion": {
      es: "/informacion",
      en: "/info",
      pt: "/informacoes",
    },
    "/leyenda": {
      es: "/leyenda",
      en: "/legend",
      pt: "/lenda",
    },
    "/eventos": {
      es: "/eventos",
      en: "/events",
      pt: "/eventos",
    },
    "/privacidad": {
      es: "/privacidad",
      en: "/privacy",
      pt: "/privacidade",
    },
    "/pueblos": {
      es: "/pueblos",
      en: "/villages",
      pt: "/povoados",
    },
    "/pueblos/[slug]": {
      es: "/pueblos/[slug]",
      en: "/villages/[slug]",
      pt: "/povoados/[slug]",
    },
  },
});
