import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideComputer, LucideDog, LucideEqual, LucidePlus, LucideSmile } from "lucide-react";
import Image from 'next/image';
import { Flashcard } from '../../components/flashcard';
import { FunIcons, GradientText } from '../../components/funText';

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
        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <p className="text-lg mb-4">
              Founded in 2010, DogTownUSA started with a simple mission: to create a paradise for dogs and their owners.
              What began as a small grooming service has grown into a comprehensive pet care center, offering everything
              from daycare and training to veterinary services.
            </p>
            <p className="text-lg mb-4">
              Our passion for pets drives everything we do. We believe that every dog deserves the best care, love, and
              attention. That&apos;s why we&apos;ve assembled a team of experienced professionals who share our vision and values.
            </p>
          </div>
          <Card className="overflow-hidden">
            <Image
              src="/myImages/My-Pi.jpeg"
              alt="DogTownUSA facility with happy dogs playing"
              width={600}
              height={400}
              className="w-full object-cover"
            />
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Our state-of-the-art facility provides a safe and fun environment for dogs of all sizes.</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <Image
              src="/myImages/My-Pi-Setup.jpeg"
              alt="DogTownUSA facility with happy dogs playing"
              width={600}
              height={400}
              className="w-full object-cover"
            />
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Our state-of-the-art facility provides a safe and fun environment for dogs of all sizes.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
        <Card>
          <CardHeader>
            <CardTitle>Enhancing the lives of pets and their families</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              At DogTownUSA, we strive to provide exceptional care and services that enrich the bond between pets
              and their owners. We&apos;re committed to creating a safe, fun, and nurturing environment where dogs can
              thrive and their owners can have peace of mind.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: "Jane Doe", role: "Founder & CEO", image: "/placeholder.svg?height=200&width=200" },
            { name: "John Smith", role: "Head Trainer", image: "/placeholder.svg?height=200&width=200" },
            { name: "Emily Brown", role: "Lead Veterinarian", image: "/placeholder.svg?height=200&width=200" },
          ].map((member) => (
            <Card key={member.name}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={128}
                      height={128}
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="text-muted-foreground">{member.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: "Compassion", description: "We treat every pet with the love and care they deserve." },
            { title: "Excellence", description: "We strive for the highest standards in all our services." },
            { title: "Innovation", description: "We continuously seek new ways to improve pet care." },
            { title: "Community", description: "We foster a strong, supportive community of pet lovers." },
          ].map((value) => (
            <Card key={value.title}>
              <CardHeader>
                <CardTitle>{value.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
