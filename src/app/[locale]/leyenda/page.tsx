import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import { PageHero } from "@/components/ui/page-hero";
import { ListenButton } from "@/components/ui/listen-button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getLocalityBySlug } from "@/lib/data/localities";
import { getPlaceBySlug } from "@/lib/data/places";
import { getRouteBySlug } from "@/lib/data/routes";
import { buildPageMetadata, truncateDescription } from "@/lib/seo";
import { REPORTAJES } from "@/lib/reportajes";
import { ReportajesSection } from "@/components/video/reportajes-section";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "legend" });
  return buildPageMetadata({
    locale,
    href: "/leyenda",
    title: t("title"),
    description: truncateDescription(`${t("subtitle")} ${t("poem.body")}`),
  });
}

const VERSIONS = ["stranger", "rider", "miner"] as const;

/**
 * Escenas de la versión de la ruta (diablo campesino, entrega 2026-11-02, en
 * `public/leyendas/`): cada una ilustra una frase de `route.body`. Sin texto
 * sobre la imagen; el pie va en la interfaz.
 */
const ROUTE_SCENES = [
  { key: "cueca", src: "/leyendas/cueca.webp" },
  { key: "anoNuevo", src: "/leyendas/ano-nuevo.webp" },
  { key: "escalera", src: "/leyendas/escalera.webp" },
] as const;

/** Fuentes de todo lo que cuenta la página (ver docs/PROPUESTA-CONTENIDO-PETORCA.md). */
const SOURCES = [
  { key: "fucoa", url: "https://fucoa.cl/publicaciones/mandinga/" },
  {
    key: "informador",
    url: "https://www.elinformador.cl/actualidad-regional/donde-diablo-perdio-poncho-la-nueva-ruta-turistica-petorca/",
  },
] as const;

/**
 * "La leyenda del diablo" — pedido del usuario: el sitio se llama como el
 * dicho pero no lo contaba. Todo sale de fuentes citadas al pie (FUCOA,
 * "El Mandinga", 2021, que recoge el poema de 1894 y las versiones del libro
 * de 2015; y la versión de la ruta, El Informador, 2018), contado con
 * palabras propias. "Escuchar" lee la página entera, en orden.
 */
export default async function LegendPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("legend");
  const tVideos = await getTranslations("videos");

  // Solo se enlaza lo que existe en la base (Chalaco se carga con
  // supabase/manual/chalaco.sql): nunca un link a una página vacía.
  const [chalaco, escalera, route] = await Promise.all([
    getLocalityBySlug("chalaco", locale),
    getPlaceBySlug("escalera-del-diablo", locale),
    getRouteBySlug("ruta-del-diablo-pedegua-chincolco", locale),
  ]);

  const sections = [
    { key: "saying", text: t("saying.body") },
    { key: "poem", text: t("poem.body") },
  ] as const;

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8">
      <PageHero title={t("title")} subtitle={t("subtitle")} scene="tunel" />

      <ListenButton
        name={t("title")}
        segments={[
          `${t("title")}.`,
          ...sections.flatMap(({ key, text }) => [
            `${t(`${key}.title`)}.`,
            text,
          ]),
          `${t("versions.title")}.`,
          ...VERSIONS.flatMap((key) => [
            `${t(`versions.${key}.title`)}.`,
            t(`versions.${key}.body`),
          ]),
          `${t("route.title")}.`,
          t("route.body"),
        ]}
      />

      {sections.map(({ key, text }) => (
        <section key={key} className="reveal flex flex-col gap-2">
          <h2 className="font-display text-xl font-semibold">
            {t(`${key}.title`)}
          </h2>
          <p className="text-foreground/80 leading-relaxed">{text}</p>
        </section>
      ))}

      <section className="reveal flex flex-col gap-3">
        <h2 className="font-display text-xl font-semibold">
          {t("versions.title")}
        </h2>
        <p className="text-foreground/60 text-sm">{t("versions.intro")}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {VERSIONS.map((key) => (
            <article
              key={key}
              className="surface-glass flex flex-col gap-2 rounded-2xl p-4"
            >
              <h3 className="text-accent font-semibold">
                {t(`versions.${key}.title`)}
              </h3>
              <p className="text-foreground/80 text-sm leading-relaxed">
                {t(`versions.${key}.body`)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="reveal flex flex-col gap-2">
        <h2 className="font-display text-xl font-semibold">
          {t("route.title")}
        </h2>
        <p className="text-foreground/80 leading-relaxed">{t("route.body")}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {ROUTE_SCENES.map(({ key, src }) => (
            <figure key={key} className="flex flex-col gap-1.5">
              <div className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src={src}
                  alt={t(`images.${key}`)}
                  fill
                  sizes="(min-width: 640px) 240px, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="text-foreground/60 text-xs">
                {t(`images.${key}`)}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <ReportajesSection
        id="reportajes"
        title={tVideos("title")}
        subtitle={tVideos("subtitle")}
        items={REPORTAJES}
      />

      {(chalaco || escalera || route) && (
        <section className="reveal flex flex-col gap-3">
          <h2 className="font-display text-xl font-semibold">
            {t("visit.title")}
          </h2>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <Image
              src="/leyendas/diablo-buscando.webp"
              alt={t("images.buscando")}
              width={180}
              height={180}
              className="h-40 w-40 shrink-0 object-contain drop-shadow-[0_8px_24px_rgba(255,122,69,0.25)] sm:h-44 sm:w-44"
            />
            <ul className="flex w-full flex-col gap-2">
              {chalaco && (
                <li>
                  <Link
                    href={{
                      pathname: "/pueblos/[slug]",
                      params: { slug: chalaco.slug },
                    }}
                    className="surface-glass hover:border-accent flex items-center gap-3 rounded-2xl border border-white/10 p-3 transition-colors"
                  >
                    <CategoryIcon
                      icon="poncho"
                      className="text-accent h-6 w-6"
                    />
                    {t("visit.chalaco")}
                  </Link>
                </li>
              )}
              {escalera && (
                <li>
                  <Link
                    href={{
                      pathname: "/lugares/[slug]",
                      params: { slug: escalera.slug },
                    }}
                    className="surface-glass hover:border-accent flex items-center gap-3 rounded-2xl border border-white/10 p-3 transition-colors"
                  >
                    <CategoryIcon
                      icon="diablo"
                      className="text-accent h-6 w-6"
                    />
                    {t("visit.escalera")}
                  </Link>
                </li>
              )}
              {route && (
                <li>
                  <Link
                    href={{
                      pathname: "/rutas/[slug]",
                      params: { slug: route.slug },
                    }}
                    className="surface-glass hover:border-accent flex items-center gap-3 rounded-2xl border border-white/10 p-3 transition-colors"
                  >
                    <CategoryIcon icon="tren" className="text-accent h-6 w-6" />
                    {t("visit.route")}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-1">
        <h2 className="text-foreground/60 text-sm font-medium">
          {t("sources.title")}
        </h2>
        <ul className="text-foreground/60 flex flex-col gap-1 text-xs">
          {SOURCES.map(({ key, url }) => (
            <li key={key}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent underline underline-offset-2"
              >
                {t(`sources.${key}`)}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
