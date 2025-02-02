"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navigation = [{ name: "Home", href: "/" }];

  return (
    <header className="sticky top-0 z-50 w-full bg-gray-800">
      <div className="container mx-auto px-4 max-w-7xl flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/peach.png" width={32} height={32} alt="peach" />
            <span className="font-bold text-xl text-[#FA7043]">BootyPics.com</span>
          </Link>
        </div>

        <nav className="flex gap-6">
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
        </nav>
      </div>
    </header>
  );
}
