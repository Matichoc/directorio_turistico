import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import messages from "@/messages/es.json";
import type { RouteCard as RouteCardType } from "@/types/domain";

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

const { RouteCard } = await import("@/components/route/route-card");

const baseRoute: RouteCardType = {
  id: "1",
  slug: "ruta-del-diablo",
  name: "Ruta del Diablo",
  description: "Recorre los lugares detrás del dicho.",
  estimatedDurationMinutes: 240,
  stopsCount: 4,
  photoUrl: null,
};

describe("RouteCard", () => {
  it("renders the route name, description and stop count", () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <RouteCard route={baseRoute} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Ruta del Diablo")).toBeInTheDocument();
    expect(
      screen.getByText("Recorre los lugares detrás del dicho."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Paradas: 4/)).toBeInTheDocument();
  });

  it("links to the route detail page by slug", () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <RouteCard route={baseRoute} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/rutas/[slug]/ruta-del-diablo",
    );
  });
});
