import Footer from "@/components/footer";
import Header from "@/components/header";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { Comfortaa, Inter } from 'next/font/google';
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: "DogTown",
    template: "%s | DogTown",
  },
  description: "A community gallery for sharing photos of our favorite dogs. Upload, browse, and celebrate the goodest boys and girls.",
  keywords: ["dogs", "dog photos", "pet gallery", "dog community"],
  authors: [{ name: "Rio Edwards" }],
  creator: "Rio Edwards",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "DogTown",
    title: "DogTown",
    description: "A community gallery for sharing photos of our favorite dogs.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DogTown",
    description: "A community gallery for sharing photos of our favorite dogs.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;

  return (
    <html lang="en" className={`${inter.variable} ${comfortaa.variable} scroll-smooth antialiased`} suppressHydrationWarning>
      <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
      <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, maximum-scale=1.0"></meta>
      {umamiWebsiteId && umamiUrl && (
        <Script
          defer
          src={`${umamiUrl}/script.js`}
          data-website-id={umamiWebsiteId}
          strategy="afterInteractive"
        />
      )}
      <body className="font-sans flex min-h-screen flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          <Providers>
            <Header />
            <main className="container mx-auto max-w-7xl flex-1 pt-8">{children}</main>
            <Toaster />
            <Footer />
          </Providers>
        </ThemeProvider>
      </body>
    </html >
  );
}
