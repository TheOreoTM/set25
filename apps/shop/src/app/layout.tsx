import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "@fontsource-variable/inter";
import "@fontsource/rajdhani/500.css";
import "@fontsource/rajdhani/600.css";
import "@fontsource/rajdhani/700.css";
import "./globals.css";
import { Announcement } from "@/components/announcement";
import { CartProvider } from "@/components/cart-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://set25.mv";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SET25 — Built for the next point.",
    template: "%s · SET25",
  },
  description:
    "SET25 is a volleyball performance brand from the Maldives. Gear built for the next rally, the next session, the next point.",
  applicationName: "SET25",
  openGraph: {
    type: "website",
    siteName: "SET25",
    locale: "en_MV",
    title: "SET25 — Built for the next point.",
    description:
      "Volleyball performance gear built for the next rally, the next session, the next point.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <CartProvider>
          <Suspense fallback={null}>
            <Announcement />
          </Suspense>
          <SiteHeader />
          <div id="main" className="site-main">
            {children}
          </div>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
