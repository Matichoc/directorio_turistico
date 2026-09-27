import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { PageHero } from "@/components/ui/page-hero";
import { listMunicipalities } from "@/lib/data/communes";
import { contactLinkHref, contactLinkLabel } from "@/lib/ui/contact-link";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const info = await getTranslations("info");
  const municipalityT = await getTranslations("home.municipality");
  const municipalities = await listMunicipalities(locale);

  const kindLabels: Record<string, string> = {
    website: municipalityT("linkKinds.website"),
    facebook: municipalityT("linkKinds.facebook"),
    instagram: municipalityT("linkKinds.instagram"),
    twitter: municipalityT("linkKinds.twitter"),
    phone: municipalityT("linkKinds.phone"),
    email: municipalityT("linkKinds.email"),
  };

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8">
      <PageHero title={t("info")} subtitle={info("about")} />

      <section className="flex flex-col gap-1">
        <h2 className="text-foreground/50 text-sm font-medium">
          {info("developmentTitle")}
        </h2>
        <p className="text-foreground/80 text-sm">
          {info("developmentCredit")}
        </p>
        <p className="text-foreground/60 text-sm">{info("developerTagline")}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          <a
            href="https://instagram.com/el.cristo.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="border-accent-soft text-foreground/70 hover:border-accent rounded-full border px-3 py-1 text-xs dark:border-white/15"
          >
            {info("developerInstagram")}
          </a>
          <a
            href="https://wa.me/56942586908"
            target="_blank"
            rel="noopener noreferrer"
            className="border-accent-soft text-foreground/70 hover:border-accent rounded-full border px-3 py-1 text-xs dark:border-white/15"
          >
            {info("developerWhatsapp")}
          </a>
        </div>
      </section>

      <p className="text-foreground/60 text-sm">{info("sponsorNote")}</p>

      {municipalities.some((municipality) => municipality.links.length > 0) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-foreground/50 text-sm font-medium">
            {info("contactsTitle")}
          </h2>
          <ul className="flex flex-col gap-3">
            {municipalities
              .filter((municipality) => municipality.links.length > 0)
              .map((municipality) => (
                <li key={municipality.id} className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {municipality.name}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {municipality.links.map((link) => (
                      <a
                        key={`${link.kind}-${link.value}`}
                        href={contactLinkHref(link.kind, link.value)}
                        target={
                          link.kind === "phone" || link.kind === "email"
                            ? undefined
                            : "_blank"
                        }
                        rel="noopener noreferrer"
                        className="border-accent-soft text-foreground/70 hover:border-accent rounded-full border px-3 py-1 text-xs dark:border-white/15"
                      >
                        {contactLinkLabel(link, kindLabels)}
                      </a>
                    ))}
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}
    </main>
  );
}
