import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { FloatingLanguageSwitcher } from "@/components/LanguageSwitcher";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Khapesethamatmon - Spy Scavenger Hunt Platform",
  description: "Self-serve platform for creating and running spy-themed scavenger hunts with QR codes, video missions, and real-time tracking.",
  keywords: ["scavenger hunt", "spy games", "QR codes", "events", "kids activities"],
  authors: [{ name: "Khapesethamatmon Team" }],
  creator: "Khapesethamatmon",
  publisher: "Khapesethamatmon",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Khapesethamatmon - Spy Scavenger Hunt Platform",
    description: "Create immersive spy-themed scavenger hunts with custom videos, QR codes, and real-time tracking.",
    type: "website",
    locale: "he_IL",
    alternateLocale: ["en_US"],
  },
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@100..900&family=Assistant:wght@200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-hebrew antialiased`}>
        <LanguageProvider>
          <div id="root">{children}</div>
          <FloatingLanguageSwitcher />
        </LanguageProvider>
      </body>
    </html>
  );
}
