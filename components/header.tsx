"use client";
import { AuthButton } from "@/components/auth-button";
import { cn } from "@/lib/utils";
import { PawPrint } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 max-w-7xl flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <PawPrint strokeWidth={2} fill="black" className="h-6 w-6 mt-[2px]" />
            <span className="font-bold text-xl">DogTownUSA</span>
          </Link>
        </div>

        <nav className="flex gap-6 items-center">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}>
              {item.name}
            </Link>
          ))}
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
