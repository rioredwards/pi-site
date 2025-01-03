import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Linkedin, LucideComputer, LucideDog, LucideEqual, LucidePlus, LucideSmile, Youtube } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { Flashcard } from "../../components/flashcard"
import { FunIcons, GradientText } from "../../components/funText"


export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">About</h1>

      <section className="mb-12">
        <Flashcard question="What do Dogs and Computers have in common?" >
          <div className="w-full max-w-3xl mx-auto text-center py-8">
            <FunIcons icons={[<LucideDog key={1} className="h-16 w-16 text-red-500" />,
            <LucidePlus key={2} className="h-10 w-10 translate-y-4" />,
            <LucideComputer key={3} className="h-16 w-16 text-orange-500" />,
            <LucideEqual key={4} className="h-10 w-10 translate-y-4" />,
            <LucideSmile key={5} className="h-16 w-16 text-yellow-500" />]} />
            <GradientText text="They make me Happy!" />
          </div>
        </Flashcard>
      </section>

      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Who am I?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-12">
            <Image
              src="/myImages/Rio-With-Pups.jpg"
              alt="Rio, a software developer and dog-lover"
              width={400}
              height={400}
              className="rounded-full w-72 md:w-80"
            />

            <div className="bg-gray-100 p-6 rounded-lg shadow-md w-full">
              <p className="text-2xl font-bold text-gray-800">Hello! 👋 </p>
              <p className="text-lg text-gray-600 mt-2">I&apos;m Rio, a Software Developer and Dog-Lover living in Portland, OR.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>What is this?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row-reverse items-start gap-6">
            <Image
              src="/myImages/My-Pi.jpeg"
              alt="A Raspberry Pi"
              width={400}
              height={300}
              className="rounded-lg"
            />
            <p>
              Over the holidays, I got a Raspberry Pi as a gift from my sister (!!!).
              After some tinkering and late-night coding sessions, this little project came to life—my first
              self-hosted website! Naturally, the theme is dog photos because, my life pretty much revolves
              around these majestic furballs.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-12">
        <Card >
          <CardHeader>
            <CardTitle>Inspiration</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-start gap-6">
            <div className="bg-gray-100 p-6 rounded-lg shadow-md w-full">
              <p>
                I started programming in 2021, and since then, I&apos;ve always relied on <span className="font-semibold bg-slate-200 rounded-md px-1 py-1">The Cloud ☁️</span> to deploy my websites.
                With this project, I wanted to step outside my comfort zone and dive into the world of self-hosting.
                It felt like the perfect way to fill some knowledge gaps, satisfy my curiosity, and get familiar with
                with my new Raspberry Pi. Building this site was a ton of fun—and I learned a lot along the way!
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>The setup (for techy people)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
              <Image
                src="/myImages/My-Pi-Setup.jpeg"
                alt="A technical setup with computer and Raspberry Pi"
                width={400}
                height={300}
                className="rounded-lg"
              />
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Coding:</strong> I write the code for this website on my laptop and push updates to GitHub when I&apos;m ready to deploy.</li>
                <li><strong>Deploying:</strong> I SSH into my Raspberry Pi and run a shell script that pulls the latest code from GitHub, installs dependencies, builds the project, and starts the server. Originally, I considered setting up a CI/CD pipeline with GitHub Actions, but that required SSH-ing into my Pi over the public internet which was out of scope for this project.</li>
                <li><strong>Serving:</strong> I&apos;m using Cloudflare Tunnels to securely route traffic from my domain to the Pi. This felt easier (and safer) than setting up port forwarding on my router. Since I reused the domain for my portfolio site (rioredwards.com), I also had to transfer the domain from Vercel to Cloudflare.</li>
                <li><strong>Connecting:</strong> My laptop connects to the Raspberry Pi via Raspberry Pi Connect and SSH. I also hooked the Pi up to a TV, along with a keyboard and mouse, so I can control it directly if needed. Only one of these setups is necessary, but I had fun experimenting with different ways to access and manage it.</li>
                <li><strong>Tech stack:</strong> I built the site using Next.js and ShadCN, with some AI-powered assistance from V0 for code generation. It was my first time trying ShadCN and V0, and honestly, they made everything so easy—I&apos;m feeling both inspired and slightly… deprecated.</li>
                <li><strong>Persistence:</strong> No database here! Images are stored as files in a directory, and their metadata lives in JSON files. There&apos;s no real Auth, I just use a cookie with a uuid to link images with their owners. Therefore, users can delete their own photos, but no one else&apos;s.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Questions/Comments/Concerns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
              <div>
                <p className="mb-4">Feel free to reach out!</p>
                <div className="flex flex-wrap gap-4">
                  <Button asChild>
                    <Link href="https://www.linkedin.com/in/rioredwards/" target="_blank" rel="noopener noreferrer">
                      <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="https://www.youtube.com/@rioredwards" target="_blank" rel="noopener noreferrer">
                      <Youtube className="mr-2 h-4 w-4" /> YouTube
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="https://bsky.app/profile/rioredwards.com" target="_blank" rel="noopener noreferrer">
                      Bluesky
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="https://github.com/rioredwards" target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2 h-4 w-4" /> GitHub
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

