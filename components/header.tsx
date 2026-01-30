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
    <header className="pointer-events-auto">
      <nav
        className={cn(
          "fixed right-0 bottom-0 left-0 z-50 border-t border-border bg-card/80 px-2 backdrop-blur-sm md:py-2",
          "md:top-0 md:right-auto md:bottom-0 md:left-0 md:flex md:h-screen md:w-24 md:flex-col md:border-t-0 md:border-r md:py-6",
        )}
      >
        {/* Desktop logo */}
        <div className="mb-6 hidden items-center justify-center md:flex">
          <Link href="/" className="flex flex-col items-center gap-2">
            <Image
              src={LogoImage}
              alt="DogTown"
              width={40}
              height={40}
              className="rounded-lg"
              priority
            />
            <span className="text-sm font-semibold">DogTown</span>
          </Link>
        </div>

        {/* Mobile navigation */}
        <div className="flex flex-1 items-center justify-between md:hidden">
          {navigation.map(({ name, href, icon: Icon }, idx) => {
            const isActive =
              pathname === href || (href !== "/" && pathname?.startsWith(href));

            return (
              <Fragment key={name}>
                <Link
                  href={href}
                  className={cn(
                    "group flex h-full w-full items-center justify-center gap-1",
                    idx > 0 && "pr-2",
                  )}
                >
                  <div
                    className={cn(
                      "group flex h-full w-24 flex-col items-center justify-center gap-1 rounded-xl p-2 transition-colors duration-200",
                      "group-hover:bg-primary/20",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6 transition-colors duration-200",
                        isActive && "text-primary",
                        !isActive &&
                          "text-muted-foreground group-hover:text-primary",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium transition-colors duration-200",
                        isActive && "text-primary",
                        !isActive &&
                          "text-muted-foreground group-hover:text-primary",
                      )}
                    >
                      {name}
                    </span>
                  </div>
                </Link>
                <div className="h-10 w-px bg-border/60" />
                {idx === navigation.length - 1 && (
                  <AuthButton
                    iconVariant={{ size: "sm" }}
                    className="group w-full gap-0 rounded-xl px-2 py-2"
                    isActive={pathname?.startsWith("/profile")}
                    hideSubMenuArrow
                  >
                    <span
                      className={cn(
                        "text-xs font-medium transition-colors duration-200",
                        // isActive && "text-primary",
                        // !isActive && "text-muted-foreground group-hover:text-primary"
                      )}
                    >
                      Profile
                    </span>
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
                    "group flex w-full flex-col items-center gap-1",
                    idx > 0 && "pt-2",
                  )}
                >
                  <div
                    className={cn(
                      "group flex w-full flex-col items-center gap-1 rounded-xl p-2 transition-colors duration-200",
                      "group-hover:bg-primary/20",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6 transition-colors duration-200",
                        isActive && "text-primary",
                        !isActive &&
                          "text-muted-foreground group-hover:text-primary",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium transition-colors duration-200",
                        isActive && "text-primary",
                        !isActive &&
                          "text-muted-foreground group-hover:text-primary",
                      )}
                    >
                      {name}
                    </span>
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
        <AuthButton
          iconVariant={{ size: "sm" }}
          className="group mt-auto hidden w-full gap-0 rounded-xl py-2 md:block"
          isActive={pathname?.startsWith("/profile")}
        >
          <span
            className={cn(
              "text-xs font-medium transition-colors duration-200",
              // isActive && "text-primary",
              // !isActive && "text-muted-foreground group-hover:text-primary"
            )}
          >
            Profile
          </span>
        </AuthButton>
      </nav>
    </header>
  );
}
