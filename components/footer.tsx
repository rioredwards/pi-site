import { PawPrint } from 'lucide-react'
import Link from 'next/link'

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
              Your pet&apos;s paradise - where tails never stop wagging. Providing top-notch care and services for your furry friends since 2010.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Grooming
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Daycare
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Training
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Boarding
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Accessibility
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
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Facebook
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Twitter
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Instagram
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

