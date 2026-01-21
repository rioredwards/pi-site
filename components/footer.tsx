import { PawPrint } from "lucide-react";
import Link from "next/link";
import BlueSky from "./svg/Bluesky";
import GitHub from "./svg/GitHub";
import LinkedIn from "./svg/LinkedIn";
import YouTube from "./svg/YouTube";

export default function Footer() {
  return (
    <footer className="w-full md:pl-24 border-t bg-background">
      <div className="container mx-auto max-w-7xl py-8">
        <div className="grid grid-cols-2 gap-8 px-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 md:col-span-1 lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <PawPrint className="h-6 w-6" />
              <span className="text-lg font-bold">DogTown</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Dog dog dog dog dog dog dog dog dog dog dog dog dog dog dog
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Dog
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Dog
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Dog
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Dog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Dog
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Dog
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Dog
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Dog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Dog
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Dog
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Dog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t px-4 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DogTown. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="https://www.linkedin.com/in/rio-edwards/"
              target="_blank"
              rel="noreferrer"
            >
              <LinkedIn className="w-8" />
            </Link>
            <Link
              href="https://bsky.app/profile/rioredwards.bsky.social"
              target="_blank"
              rel="noreferrer"
            >
              <BlueSky className="w-8" />
            </Link>
            <Link
              href="https://www.youtube.com/channel/UCZdVYjS_Os_4e7DZAZSRxBQ"
              target="_blank"
              rel="noreferrer"
            >
              <YouTube className="w-8" />
            </Link>
            <Link
              href="https://github.com/rioredwards/"
              target="_blank"
              rel="noreferrer"
            >
              <GitHub className="w-8" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

