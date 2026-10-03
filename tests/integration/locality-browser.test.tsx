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
        summary: "Sector donde se descubrió oro en 1730.",
        latitude: -32.28,
        longitude: -71,
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
      {
        slug: "pedernal",
        name: "Pedernal",
        summary: null,
        latitude: null,
        longitude: null,
        places: [],
      },
    ],
  },
];

function renderBrowser({
  filtersActive = false,
  openCommune = true,
}: { filtersActive?: boolean; openCommune?: boolean } = {}) {
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <LocalityBrowser tree={tree} filtersActive={filtersActive} />
    </NextIntlClientProvider>,
  );
  if (openCommune) {
    fireEvent.click(screen.getByRole("button", { name: /^Petorca/ }));
  }
}

describe("LocalityBrowser", () => {
  it("starts with every commune folded, showing only a summary", () => {
    renderBrowser({ openCommune: false });

    expect(screen.getByRole("button", { name: /^Petorca/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByText(/2 pueblos · 1 atractivo/)).toBeInTheDocument();
    expect(screen.queryByText("Hierro Viejo")).not.toBeInTheDocument();
  });

  it("starts with communes open when filters are active", () => {
    renderBrowser({ filtersActive: true, openCommune: false });

    expect(screen.getByText("Hierro Viejo")).toBeInTheDocument();
  });

  it("folds a commune back when its header is clicked again", () => {
    renderBrowser();
    fireEvent.click(screen.getByRole("button", { name: /^Petorca/ }));

    expect(screen.queryByText("Hierro Viejo")).not.toBeInTheDocument();
  });

  it("shows villages collapsed once the commune is open", () => {
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

  it("shows a village summary only when it has one", () => {
    renderBrowser();
    fireEvent.click(screen.getByRole("button", { name: /Hierro Viejo/ }));
    expect(
      screen.getByText("Sector donde se descubrió oro en 1730."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Pedernal/ }));
    expect(screen.getAllByText(/descubrió oro/)).toHaveLength(1);
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
