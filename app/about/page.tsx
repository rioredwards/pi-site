import BlueSky from "@/components/svg/Bluesky";
import {
  CardContent,
  CardHeader,
  CardIcon,
  CardTitle,
  CardWithGradientBorder,
} from "@/components/ui/card";
import {
  Blocks,
  Lightbulb,
  LucideComputer,
  LucideDog,
  LucideEqual,
  LucideMessageCircleQuestion,
  LucidePlus,
  LucideSmile,
  MessageCircleMore,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Flashcard } from "../../components/flashcard";
import { FunIcons, GradientText } from "../../components/funText";
import GitHub from "../../components/svg/GitHub";
import LinkedIn from "../../components/svg/LinkedIn";
import RaspberryPi from "../../components/svg/RaspberryPi";
import YouTube from "../../components/svg/YouTube";
import { ColorfulUnderline } from "../../components/ui/ColorfulUnderline";
import PillHighlight from "../../components/ui/pillHighlight";
import { RotatingGradientBorder } from "../../components/ui/RotatingGradientBorder";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-16 mt-8">
        <div className="flex flex-col items-center gap-12">
          <Image
            src="/myImages/Rio-With-Pups.jpg"
            alt="Rio, a software developer and dog-lover"
            width={400}
            height={400}
            className="rounded-full w-72 md:w-96"
          />

          <div className="bg-background p-6 rounded-lg shadow-md -mt-20">
            <p className="text-2xl font-bold text-foreground">
              Hello! <span className="reverse inline-block">👋</span>{" "}
            </p>
          </div>
          <p className="text-lg text-foreground mt-2">
            I&apos;m Rio, a <ColorfulUnderline color="green">Software Developer</ColorfulUnderline>{" "}
            and <ColorfulUnderline color="blue">Dog-Lover</ColorfulUnderline> living in Portland,
            OR.
          </p>
        </div>
      </section>

      <section id="what-is-this?" className="mb-12">
        <CardWithGradientBorder
          // blue gradient
          borderColors={["#0000FF", "#1E90FF", "#00BFFF", "#ADD8E6"]}
          className="rounded-lg">
          <CardHeader>
            <CardIcon>
              <LucideMessageCircleQuestion
                key={5}
                className="group-hover:text-blue-500 text-gray-300 w-full h-full"
              />
            </CardIcon>
            <CardTitle>What is this?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row-reverse items-start gap-6">
            <Image
              src="/myImages/My-Pi.jpeg"
              alt="A Raspberry Pi"
              width={400}
              height={300}
              className="rounded-lg w-full md:w-2/4"
            />
            <p>
              Over the holidays, I got a{" "}
              <PillHighlight color="red">
                Raspberry Pi <RaspberryPi className="inline mr-[2px] -mt-[2px] w-[16px]" />
              </PillHighlight>{" "}
              as a gift from my sister (best gift ever!). After some tinkering and late-night coding
              sessions, this little project came to life—my first
              <span className="font-bold"> self-hosted website</span>!
              <br />
              <br />
              Naturally, the <span className="italic">theme</span> is{" "}
              <span className="font-bold">dog photos</span> because, my life pretty much revolves
              around these majestic furballs. 🐶
            </p>
          </CardContent>
        </CardWithGradientBorder>
      </section>

      <section className="mb-12">
        <Flashcard question="What do Dogs and Computers have in common? 🤔">
          <div className="w-full max-w-3xl mx-auto text-center py-8">
            <FunIcons
              icons={[
                <LucideDog key={1} className="h-16 w-16 text-red-500" />,
                <LucidePlus key={2} className="h-10 w-10 translate-y-4" />,
                <LucideComputer key={3} className="h-16 w-16 text-orange-500" />,
                <LucideEqual key={4} className="h-10 w-10 translate-y-4" />,
                <LucideSmile key={5} className="h-16 w-16 text-yellow-500" />,
              ]}
            />
            <GradientText className="animate-pulse">They make me Happy!</GradientText>
          </div>
        </Flashcard>
      </section>

      <section className="mb-12">
        <CardWithGradientBorder
          borderColors={["#A020F0", "#E7B1FE", "#A020F0", "#E7B1FE"]}
          className="rounded-lg">
          <CardHeader>
            <CardIcon>
              <Lightbulb
                key={5}
                className="group-hover:text-purple-500 text-gray-300 w-full h-full"
              />
            </CardIcon>
            <CardTitle>Inspiration</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-start gap-6">
            <div className="bg-gray-100 p-6 rounded-lg shadow-md w-full">
              <p>
                I started programming in 2021, and since then, I&apos;ve always relied
                <PillHighlight color="blue">The Cloud ☁️</PillHighlight> to deploy my websites.
                <br />
                <br />
                With this project, I wanted to step outside my comfort zone and dive into the world
                of <PillHighlight color="red">self-hosting 📡</PillHighlight>. It felt like the
                perfect way to fill some knowledge gaps, satisfy my curiosity, and get familiar with
                with my new Raspberry Pi. Building this site was a ton of fun—and I learned a lot
                along the way! 🧠
              </p>
            </div>
          </CardContent>
        </CardWithGradientBorder>
      </section>

      <section className="mb-12">
        <CardWithGradientBorder
          borderColors={["#00E04B", "#00E1A5", "#0F0", "#98FB98"]}
          className="rounded-lg">
          <CardHeader>
            <CardIcon>
              <Blocks key={5} className="group-hover:text-green-500 text-gray-300 w-full h-full" />
            </CardIcon>
            <div className="flex flex-row justify-start items-baseline space-x-2">
              <CardTitle>The setup</CardTitle>
              <p className="font-light text-sm">(for techy people)</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-start gap-6 mb-6">
              <Image
                src="/myImages/My-Pi-Setup.jpeg"
                alt="A technical setup with computer and Raspberry Pi"
                width={400}
                height={300}
                className="rounded-lg w-full lg:w-2/4"
              />
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Coding:</strong> I write the code for this website on my laptop and push
                  updates to GitHub when I&apos;m ready to deploy.
                </li>
                <li>
                  <strong>Deploying:</strong> I SSH into my Raspberry Pi and run a shell script that
                  pulls the latest code from GitHub, installs dependencies, builds the project, and
                  starts the server. Originally, I considered setting up a CI/CD pipeline with
                  GitHub Actions, but that required SSH-ing into my Pi over the public internet
                  which was out of scope for this project.
                </li>
                <li>
                  <strong>Serving:</strong> I&apos;m using Cloudflare Tunnels to securely route
                  traffic from my domain to the Pi. This felt easier (and safer) than setting up
                  port forwarding on my router. Since I reused the domain for my portfolio site
                  (rioredwards.com), I also had to transfer the domain from Vercel to Cloudflare.
                </li>
                <li>
                  <strong>Connecting:</strong> My laptop connects to the Raspberry Pi via Raspberry
                  Pi Connect and SSH. I also hooked the Pi up to a TV, along with a keyboard and
                  mouse, so I can control it directly if needed. Only one of these setups is
                  necessary, but I had fun experimenting with different ways to access and manage
                  it.
                </li>
                <li>
                  <strong>Tech stack:</strong> I built this site using Next.js, React.js, ShadCN,
                  Tailwind, and Node.js. I had some fun making custom components, like these
                  <RotatingGradientBorder containerClassName="mx-1 inline-block">
                    <span className="px-2">Glowing Gradient Borders</span>
                  </RotatingGradientBorder>
                  .
                </li>
                <li>
                  <strong>Persistence:</strong> No database here! Images are stored as files in a
                  directory, and their metadata lives in JSON files. There&apos;s no real Auth, I
                  just use a cookie with a uuid to link images with their owners. Therefore, users
                  can delete their own photos, but no one else&apos;s.
                </li>
              </ul>
            </div>
          </CardContent>
        </CardWithGradientBorder>
      </section>

      <section>
        <CardWithGradientBorder
          borderColors={["#FF0000", "#FF4500", "#FF6347", "#FF0000", "#FF4500", "#FF6347"]}
          className="rounded-lg">
          <CardHeader>
            <CardIcon>
              <MessageCircleMore
                key={5}
                className="group-hover:text-red-500 text-gray-300 w-full h-full"
              />
            </CardIcon>
            <CardTitle>Contact Me</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
              <div>
                <p className="mb-4">
                  Feel free to reach out with any comments, questions or concerns!
                </p>
                <div className="flex gap-4">
                  <Link
                    href="https://www.linkedin.com/in/rio-edwards/"
                    target="_blank"
                    rel="noreferrer">
                    <LinkedIn className="w-8" />
                  </Link>
                  <Link
                    href="https://bsky.app/profile/rioredwards.bsky.social"
                    target="_blank"
                    rel="noreferrer">
                    <BlueSky className="w-8" />
                  </Link>
                  <Link
                    href="https://www.youtube.com/channel/UCZdVYjS_Os_4e7DZAZSRxBQ"
                    target="_blank"
                    rel="noreferrer">
                    <YouTube className="w-8" />
                  </Link>
                  <Link href="https://github.com/rioredwards/" target="_blank" rel="noreferrer">
                    <GitHub className="w-8" />
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </CardWithGradientBorder>
      </section>
    </div>
  );
}
