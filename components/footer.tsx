import { PawPrint } from 'lucide-react';
import Link from 'next/link';
import BlueSky from './svg/Bluesky';
import GitHub from './svg/GitHub';
import LinkedIn from './svg/LinkedIn';
import YouTube from './svg/YouTube';

export default function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto max-w-7xl py-8">
        <div className="grid px-4 grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 md:col-span-1 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <PawPrint className="h-6 w-6" />
              <span className="font-bold text-lg">DogTownUSA</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Dog dog dog dog dog dog dog dog dog dog dog dog dog dog dog
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dog
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dog
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dog
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dog
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dog
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dog
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dog
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dog
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DogTownUSA. All rights reserved.
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
  )
}

