import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CookieProvider } from "../context/CookieCtx";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BootyPics.com",
  description: "Welcome to BootyPics.com",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <CookieProvider>
          {children}
          <Toaster />
        </CookieProvider>
      </body>
    </html>
  );
}
