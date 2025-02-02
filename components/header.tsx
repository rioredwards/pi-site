"use client";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-gray-800">
      <div className="container mx-auto px-4 max-w-7xl flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/peach.png" width={32} height={32} alt="peach" />
            <span className="font-bold text-xl text-[#FA7043]">BootyPics.com</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
