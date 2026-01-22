import { Metadata } from "next";
import Link from "next/link";
import { StatsDashboard } from "../../components/stats-dashboard";
import { RotatingGradientBorder } from "../../components/ui/RotatingGradientBorder";

export const metadata: Metadata = {
  title: "System Stats | DogTown",
  description: "Live system statistics from the Raspberry Pi server",
};

export default function StatsPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:pl-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">System Stats</h1>
        <p className="text-muted-foreground mt-2">
          This site is running on a Raspberry Pi in my bedroom 👾
        </p>
        <p className="text-muted-foreground mt-2">
          Check out the <Link href="/about" className="text-blue-500 hover:text-blue-600">about page</Link> if you want to learn more about the project. Also, feel free to reach out! I&apos;m happy to share!
        </p>
      </div>

      {/* Static System Info */}
      <RotatingGradientBorder
        borderRadius="24px"
        shadow={false}
        borderColors={["rgb(151, 11, 11)", "rgb(46, 0, 146)", "rgb(151, 11, 11)", "rgb(46, 0, 146)",]}
        spinAnimationSpeed={20}
      >
        <StatsDashboard />
      </RotatingGradientBorder>
    </div>
  );
}
