import Footer from "@/components/footer";
import Header from "@/components/header";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto max-w-7xl bg-gray-700">{children}</main>
      <Toaster />
      <Footer />
    </>
  );
}
