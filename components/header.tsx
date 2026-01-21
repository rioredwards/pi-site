"use client";
import { cn } from "@/app/lib/utils";
import { AuthButton } from "@/components/auth-button";
import LogoImage from "@/public/logo.png";
import { BarChart3, Home, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

export default function Header() {
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "About", href: "/about", icon: Info },
    { name: "Stats", href: "/stats", icon: BarChart3 },
  ];

  return (
    <header className="pointer-events-auto z-99">
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-sm border-t border-border px-2 md:py-2",
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

        {/* Mobile navigation */}
        <div className="md:hidden flex flex-1 items-center justify-between">
          {navigation.map(({ name, href, icon: Icon }, idx) => {
            const isActive =
              pathname === href || (href !== "/" && pathname?.startsWith(href));

            return (
              <Fragment key={name}>
                <Link
                  href={href}
                  className={cn(
                    "flex h-full group items-center justify-center gap-1 w-full",
                    idx > 0 && "pr-2"
                  )}
                ><div className={cn(
                  "flex flex-col w-24 h-full group items-center justify-center gap-1 p-2 rounded-xl transition-colors duration-200",
                  "group-hover:bg-primary/20"
                )}>
                    <Icon className={cn(
                      "h-6 w-6 transition-colors duration-200",
                      isActive && "text-primary",
                      !isActive && "text-muted-foreground group-hover:text-primary"
                    )} />
                    <span className={cn(
                      "text-xs font-medium transition-colors duration-200",
                      isActive && "text-primary",
                      !isActive && "text-muted-foreground group-hover:text-primary"
                    )}>{name}</span>
                  </div>
                </Link>
                <div className="w-px h-10 bg-border/60" />
                {idx === navigation.length - 1 && (
                  <AuthButton iconVariant={{ size: "sm" }} className="gap-0 rounded-xl px-2 py-2 group w-full" isActive={pathname?.startsWith("/profile")}>
                    <span className={cn(
                      "text-xs font-medium transition-colors duration-200",
                      isActive && "text-primary",
                      !isActive && "text-muted-foreground group-hover:text-primary"
                    )}>Profile</span>
                  </AuthButton>
                )}
              </Fragment>
            );
          })}
        </div>

        {/* Desktop: vertical nav */}
        <div className="hidden md:flex md:flex-col md:items-center">
          {navigation.map(({ name, href, icon: Icon }, idx) => {
            const isActive =
              pathname === href || (href !== "/" && pathname?.startsWith(href));

            return (
              <Fragment key={name}>
                <Link
                  href={href}
                  className={cn(
                    "flex flex-col w-full group items-center gap-1",
                    idx > 0 && "pt-2"
                  )}
                ><div className={cn(
                  "flex flex-col w-full group items-center gap-1 p-2 rounded-xl transition-colors duration-200",
                  "group-hover:bg-primary/20"
                )}>
                    <Icon className={cn(
                      "h-6 w-6 transition-colors duration-200",
                      isActive && "text-primary",
                      !isActive && "text-muted-foreground group-hover:text-primary"
                    )} />
                    <span className={cn(
                      "text-xs font-medium transition-colors duration-200",
                      isActive && "text-primary",
                      !isActive && "text-muted-foreground group-hover:text-primary"
                    )}>{name}</span>
                  </div>
                  {idx < navigation.length - 1 && (
                    <div className="mx-auto mt-1 h-px w-10 bg-border/60" />
                  )}
                </Link>

              </Fragment>
            );
          })}
        </div>

        {/* Desktop: auth at bottom */}
        <AuthButton iconVariant={{ size: "sm" }} className="hidden md:block mt-auto gap-0 rounded-xl py-2 group w-full" isActive={pathname?.startsWith("/profile")}>
          <span className={cn(
            "text-xs font-medium transition-colors duration-200",
            // isActive && "text-primary",
            // !isActive && "text-muted-foreground group-hover:text-primary"
          )}>Profile</span>
        </AuthButton>
      </nav>
    </header>
  );
}
