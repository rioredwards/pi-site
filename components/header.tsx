"use client";
import { cn } from "@/app/lib/utils";
import { AuthButton } from "@/components/auth-button";
import LogoImage from "@/public/logo.png";
import { Home, Info, BarChart3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./ui/modeToggle";

export default function Header() {
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "About", href: "/about", icon: Info },
    { name: "Stats", href: "/stats", icon: BarChart3 },
  ];

  return (
    <header className="pointer-events-auto">
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 py-2",
          "md:top-0 md:left-0 md:bottom-0 md:right-auto md:border-t-0 md:border-r md:w-24 md:h-screen md:flex md:flex-col md:py-6"
        )}
      >
        {/* Desktop logo */}
        <div className="hidden md:flex items-center justify-center mb-6">
          <Link href="/" className="flex flex-col items-center gap-2">
            <Image
              src={LogoImage}
              alt="DogTownUSA"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-sm font-semibold">DogTownUSA</span>
          </Link>
        </div>

        {/* Primary navigation */}
        <div className="flex items-center justify-around md:flex-col md:gap-4">
          {navigation.map(({ name, href, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/" && pathname?.startsWith(href));

            return (
              <Link
                key={name}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-xl transition-colors duration-200",
                    isActive && "bg-primary/20"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium hidden md:block">
                  {name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Auth + theme controls */}
        <div className="mt-1 flex items-center justify-around gap-4 border-t border-border pt-2 md:mt-auto md:flex-col md:gap-4 md:border-t-0 md:pt-0">
          <AuthButton />
          <ModeToggle />
        </div>
      </nav>
    </header>
  );
}
