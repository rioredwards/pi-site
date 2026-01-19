"use client";
import { cn } from "@/app/lib/utils";
import { AuthButton } from "@/components/auth-button";
import LogoImage from "@/public/logo.png";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./ui/modeToggle";

export default function Header() {
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Stats", href: "/stats" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <Image src={LogoImage} alt="DogTownUSA" width={32} height={32} />
            <span className="text-xl font-bold">DogTownUSA</span>
          </Link>
        </div>

        <nav className="flex items-center gap-6">
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
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
