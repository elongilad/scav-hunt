import type { Metadata, Viewport } from "next";
import "./globals.css";
import { inter, poppins } from "./fonts";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.com"),
  title: "BuildaQuest — Turn any place into a quest",
  description: "Create and run interactive scavenger hunts with QR codes, videos, and real-time tracking.",
  keywords: ["scavenger hunt", "quest", "QR codes", "interactive", "team building"],
  authors: [{ name: "BuildaQuest Team" }],
  creator: "BuildaQuest",
  publisher: "BuildaQuest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "BuildaQuest",
    description: "Turn any place into a quest.",
    type: "website",
    locale: "en_US",
    images: ["/og/home-1200x630.png"],
  },
  icons: [
    { rel: "icon", url: "/favicon.ico", sizes: "any" },
    { rel: "icon", type: "image/png", sizes: "16x16", url: "/favicon-16x16.png" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
    { rel: "icon", type: "image/png", sizes: "96x96", url: "/favicon-96x96.png" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
    { rel: "shortcut icon", url: "/favicon.ico" }
  ],
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#10B7D4',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
