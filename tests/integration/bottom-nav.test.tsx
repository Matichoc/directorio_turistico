import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("BottomNav", () => {
  it("renders all navigation items", () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <BottomNav />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(messages.nav.home)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.explore)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.routes)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.myTrip)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.info)).toBeInTheDocument();
  });
});
