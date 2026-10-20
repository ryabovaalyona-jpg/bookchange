import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { SERVICE_NAME, SiteFooter, SiteHeader } from "@/components/chrome";

export const metadata: Metadata = {
  title: { default: SERVICE_NAME, template: `%s — ${SERVICE_NAME}` },
  description:
    "Онлайн-полка детских книг одного района: соседи отдают книги, из которых ребёнок вырос, и берут чужие — пешком, без денег и доставки.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" data-theme="paper" className="h-full antialiased">
      <body className="flex min-h-full flex-col pb-16">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">{children}</main>
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
