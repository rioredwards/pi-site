import { Metadata } from "next";
import { StatsDashboard } from "../../components/stats-dashboard";

export const metadata: Metadata = {
  title: "System Stats | DogTownUSA",
  description: "Live system statistics from the Raspberry Pi server",
};

export default function StatsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">System Stats</h1>
        <p className="text-muted-foreground mt-2">
          Live statistics from the Raspberry Pi server powering this site
        </p>
      </div>

      {/* Static System Info */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">System Information</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsDashboard />
        </div>
      </div>
    </div>
  );
}
