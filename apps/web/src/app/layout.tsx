import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { RootClient } from "@/components/root-client";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "El-bannawy Platform",
  description: "AI-Powered English Learning Platform",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.svg", sizes: "any", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "El-bannawy",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-tile-color": "#030711",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${cairo.variable}`}>
        <Providers>
          <RootClient>{children}</RootClient>
        </Providers>
      </body>
    </html>
  );
}
