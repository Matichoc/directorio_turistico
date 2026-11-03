import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import messages from "@/messages/es.json";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  Link: ({
    href,
    children,
    ...props
  }: ComponentProps<"a"> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const { BottomNav } = await import("@/components/ui/bottom-nav");

function renderNav() {
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <BottomNav />
    </NextIntlClientProvider>,
  );
}

describe("BottomNav", () => {
  afterEach(() => {
    document.cookie = "sb-prueba-auth-token=; path=/; max-age=0";
  });

  it("renders the four main sections and the More button", () => {
    renderNav();

    expect(screen.getByText(messages.nav.home)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.explore)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.routes)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.myTrip)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.nav.moreLabel }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("opens events, the legend and info from More, without the panel", () => {
    renderNav();
    fireEvent.click(
      screen.getByRole("button", { name: messages.nav.moreLabel }),
    );

    expect(screen.getByText(messages.nav.events)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.legend)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.info)).toBeInTheDocument();
    expect(screen.queryByText(messages.nav.admin)).not.toBeInTheDocument();
  });

  it("shows the team panel only with a panel session in this browser", () => {
    document.cookie = "sb-prueba-auth-token=x; path=/";
    renderNav();
    fireEvent.click(
      screen.getByRole("button", { name: messages.nav.moreLabel }),
    );

    expect(screen.getByText(messages.nav.admin).closest("a")).toHaveAttribute(
      "href",
      "/admin",
    );
  });
});
