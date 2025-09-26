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
    title: "BuildaQuest — Turn any place into a quest",
    description: "Create and run interactive scavenger hunts with QR codes, videos, and real-time tracking.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["he_IL"],
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "BuildaQuest",
    images: [
      {
        url: "/og/home-1200x630.png",
        width: 1200,
        height: 630,
        alt: "BuildaQuest - Turn any place into a quest",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildaQuest — Turn any place into a quest",
    description: "Create and run interactive scavenger hunts with QR codes, videos, and real-time tracking.",
    images: ["/og/home-1200x630.png"],
    creator: "@buildaquest",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "BuildaQuest",
    "description": "Create and run interactive scavenger hunts with QR codes, videos, and real-time tracking.",
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://buildaquest.com",
    "applicationCategory": "GameApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "category": "SaaS"
    },
    "publisher": {
      "@type": "Organization",
      "name": "BuildaQuest",
      "url": process.env.NEXT_PUBLIC_SITE_URL || "https://buildaquest.com"
    },
    "featureList": [
      "Interactive scavenger hunts",
      "QR code generation",
      "Real-time team tracking",
      "Video integration",
      "Multi-language support"
    ]
  };

  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
