import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import messages from "@/messages/es.json";
import type { PlaceCard as PlaceCardType } from "@/types/domain";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: ComponentProps<"a"> & {
    href: { pathname: string; params?: Record<string, string> };
    children: ReactNode;
  }) => (
    <a href={`${href.pathname}/${href.params?.slug ?? ""}`} {...props}>
      {children}
    </a>
  ),
}));

const { PlaceCard } = await import("@/components/place/place-card");

const basePlace: PlaceCardType = {
  id: "1",
  slug: "escalera-del-diablo",
  name: "Escalera del Diablo",
  shortDescription: "Formación rocosa en Hierro Viejo.",
  communeName: "Petorca",
  categoryName: "Naturaleza",
  categorySlug: "naturaleza",
  icon: null,
  latitude: -32.28528,
  longitude: -71.0,
  verificationStatus: "pending",
  isFeatured: false,
  photoUrl: null,
  photoCount: 0,
  tags: [],
};

describe("PlaceCard", () => {
  it("renders the place name and commune", () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <PlaceCard place={basePlace} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Escalera del Diablo")).toBeInTheDocument();
    expect(screen.getByText(/Petorca/)).toBeInTheDocument();
  });

  it("only shows the verified check once verified", () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <PlaceCard place={basePlace} />
      </NextIntlClientProvider>,
    );
    expect(screen.queryByTitle("Verificado")).not.toBeInTheDocument();

    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <PlaceCard place={{ ...basePlace, verificationStatus: "verified" }} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByTitle("Verificado")).toBeInTheDocument();
  });

  it("links to the place detail page by slug", () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <PlaceCard place={basePlace} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/lugares/[slug]/escalera-del-diablo",
    );
  });
});
