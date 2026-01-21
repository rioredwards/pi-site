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
          Live statistics from the Raspberry Pi server powering this site
        </p>
      </div>

      {/* Static System Info */}
      <StatsDashboard />
    </div>
  );
}
