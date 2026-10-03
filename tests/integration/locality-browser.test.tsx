import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import messages from "@/messages/es.json";
import type { ExploreCommuneNode } from "@/lib/ui/build-explore-tree";

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

const { LocalityBrowser } =
  await import("@/components/explore/locality-browser");

const tree: ExploreCommuneNode[] = [
  {
    slug: "petorca",
    name: "Petorca",
    localities: [
      {
        slug: "hierro-viejo",
        name: "Hierro Viejo",
        places: [
          {
            id: "1",
            slug: "escalera-del-diablo",
            name: "Escalera del Diablo",
            shortDescription: null,
            communeName: "Petorca",
            localityName: "Hierro Viejo",
            localitySlug: "hierro-viejo",
            categoryName: "Naturaleza",
            categorySlug: "naturaleza",
            icon: null,
            latitude: 0,
            longitude: 0,
            verificationStatus: "pending",
            isFeatured: false,
            photoUrl: null,
            photoCount: 0,
            tags: [],
          },
        ],
      },
      { slug: "pedernal", name: "Pedernal", places: [] },
    ],
  },
];

function renderBrowser() {
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <LocalityBrowser tree={tree} filtersActive={false} />
    </NextIntlClientProvider>,
  );
}

describe("LocalityBrowser", () => {
  it("shows communes and villages collapsed by default", () => {
    renderBrowser();

    expect(screen.getByText("Petorca")).toBeInTheDocument();
    expect(screen.getByText("Hierro Viejo")).toBeInTheDocument();
    expect(screen.queryByText("Escalera del Diablo")).not.toBeInTheDocument();
  });

  it("previews a village while the mouse is over it, then collapses", () => {
    renderBrowser();
    const item = screen.getByText("Hierro Viejo").closest("li")!;

    fireEvent.pointerEnter(item, { pointerType: "mouse" });
    expect(screen.getByText("Escalera del Diablo")).toBeInTheDocument();

    fireEvent.pointerLeave(item, { pointerType: "mouse" });
    expect(screen.queryByText("Escalera del Diablo")).not.toBeInTheDocument();
  });

  it("keeps a clicked village open after the mouse leaves, until clicked again", () => {
    renderBrowser();
    const item = screen.getByText("Hierro Viejo").closest("li")!;
    const toggle = screen.getByRole("button", { name: /Hierro Viejo/ });

    fireEvent.click(toggle);
    fireEvent.pointerLeave(item, { pointerType: "mouse" });
    expect(screen.getByText("Escalera del Diablo")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText("Escalera del Diablo")).not.toBeInTheDocument();
  });

  it("ignores touch pointers for the hover preview", () => {
    renderBrowser();
    const item = screen.getByText("Hierro Viejo").closest("li")!;

    fireEvent.pointerEnter(item, { pointerType: "touch" });
    expect(screen.queryByText("Escalera del Diablo")).not.toBeInTheDocument();
  });

  it("explains an empty village when opened", () => {
    renderBrowser();
    fireEvent.click(screen.getByRole("button", { name: /Pedernal/ }));

    expect(screen.getByText(messages.locality.noPlacesYet)).toBeInTheDocument();
  });

  it("links each real village to its own page", () => {
    renderBrowser();

    expect(
      screen.getAllByRole("link", { name: messages.explore.viewVillage })[0],
    ).toHaveAttribute("href", "/pueblos/[slug]/hierro-viejo");
  });
});
