import Footer from "@/components/footer";
import Header from "@/components/header";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import { Geist_Mono, Nunito } from 'next/font/google';
import "./globals.css";

const _nunito = Nunito({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
// const inter = Inter({ subsets: ["latin"] });

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
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "DogTown Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "DogTown",
    description: "A community gallery for sharing photos of our favorite dogs.",
    images: ["/logo.png"],
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
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
      <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, maximum-scale=1.0"></meta>
      <body className={`font-sans antialiased flex min-h-screen flex-col`}>
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
