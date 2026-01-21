"use client";
import { cn } from "@/app/lib/utils";
import { AuthButton } from "@/components/auth-button";
import LogoImage from "@/public/logo.png";
import { BarChart3, Home, Info } from "lucide-react";
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
              alt="DogTown"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-sm font-semibold">DogTown</span>
          </Link>
        </div>

        {/* Mobile: single bottom row with all items */}
        <div className="flex items-center justify-around md:hidden">
          {navigation.map(({ name, href, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/" && pathname?.startsWith(href));

            return (
              <Link
                key={name}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:scale-105",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200 shadow-sm",
                    isActive && "bg-primary/20 shadow-md",
                    !isActive && "hover:bg-muted/60"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-medium leading-tight">
                  {name}
                </span>
              </Link>
            );
          })}
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:scale-105">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 shadow-sm">
              <AuthButton />
            </div>
            <span className="text-[10px] font-medium leading-tight">
              Profile
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:scale-105">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 shadow-sm">
              <ModeToggle />
            </div>
            <span className="text-[10px] font-medium leading-tight">
              Theme
            </span>
          </div>
        </div>

        {/* Desktop: vertical nav */}
        <div className="hidden md:flex md:flex-col md:items-center md:gap-4">
          {navigation.map(({ name, href, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/" && pathname?.startsWith(href));

            return (
              <Link
                key={name}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:scale-105",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-xl transition-colors duration-200 shadow-sm",
                    isActive && "bg-primary/20 shadow-md",
                    !isActive && "hover:bg-muted/60"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium">
                  {name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Desktop: auth + theme controls at bottom */}
        <div className="hidden md:mt-auto md:flex md:flex-col md:items-center md:gap-4">
          <AuthButton />
          <ModeToggle />
        </div>
      </nav>
    </header>
  );
}
