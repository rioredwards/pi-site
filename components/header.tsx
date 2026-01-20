"use client";
import { cn } from "@/app/lib/utils";
import { AuthButton } from "@/components/auth-button";
import LogoImage from "@/public/logo.png";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ModeToggle } from "./ui/modeToggle";

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Stats", href: "/stats" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pointer-events-auto">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 relative z-50">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <Image src={LogoImage} alt="DogTownUSA" width={32} height={32} />
            <span className="text-xl font-bold">DogTownUSA</span>
          </Link>
        </div>
        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
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

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <HugeiconsIcon icon={Cancel01Icon} size={24} /> : <HugeiconsIcon icon={Menu01Icon} size={24} />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={cn(
          "fixed inset-0 top-16 z-40 cursor-pointer bg-background/80 backdrop-blur-sm transition-opacity md:hidden",
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile menu drawer */}
      <div
        className={cn(
          "fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-l bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <nav className="flex flex-col gap-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted",
                pathname === item.href
                  ? "bg-muted text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              {item.name}
            </Link>
          ))}
          <div className="my-2 border-t" />
          <div className="px-3">
            <AuthButton />
          </div>
          <div className="flex items-center justify-between px-3">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ModeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
