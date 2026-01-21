import { Metadata } from "next";
import { StatsDashboard } from "../../components/stats-dashboard";

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
          Reach out if you want to learn more about it. I&apos;m happy to share!
        </p>
      </div>

      {/* Static System Info */}
      <StatsDashboard />
    </div>
  );
}
