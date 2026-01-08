import Footer from "@/components/footer";
import Header from "@/components/header";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DogTownUSA",
  description: "Welcome to DogTownUSA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <meta
        name="format-detection"
        content="telephone=no, date=no, email=no, address=no"
      />
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Providers>
          <Header />
          <main className="container mx-auto max-w-7xl flex-1">{children}</main>
          <Toaster />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
