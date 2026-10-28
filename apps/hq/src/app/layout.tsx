import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/inter";
import "@fontsource/rajdhani/500.css";
import "@fontsource/rajdhani/600.css";
import "@fontsource/rajdhani/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Today · SET25 HQ",
    template: "%s · SET25 HQ",
  },
  description: "The private operating system for SET25.",
};

// viewport-fit=cover exposes the safe-area insets the mobile tab bar pads for.
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
