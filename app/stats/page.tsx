import { getStaticSystemInfo } from "@/app/lib/system-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { LiveStats } from "@/components/live-stats";
import { Cpu, HardDrive, MemoryStick, Monitor, Server } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Stats | DogTownUSA",
  description: "Live system statistics from the Raspberry Pi server",
};

// Revalidate static info every 60 seconds
export const revalidate = 60;

export default function StatsPage() {
  const staticInfo = getStaticSystemInfo();

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
          {/* Device */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Device</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate" title={staticInfo.piModel || "Unknown"}>
                {staticInfo.piModel || "Linux Server"}
              </div>
              <p className="text-xs text-muted-foreground">{staticInfo.arch}</p>
            </CardContent>
          </Card>

          {/* CPU */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">CPU</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{staticInfo.cpuCores} Cores</div>
              <p className="text-xs text-muted-foreground truncate" title={staticInfo.cpuModel}>
                {staticInfo.cpuModel.length > 30
                  ? staticInfo.cpuModel.substring(0, 30) + "..."
                  : staticInfo.cpuModel}
              </p>
            </CardContent>
          </Card>

          {/* Memory */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Memory</CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{staticInfo.totalMemoryGB} GB</div>
              <p className="text-xs text-muted-foreground">Total RAM</p>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{staticInfo.totalDiskGB} GB</div>
              <p className="text-xs text-muted-foreground">Root partition</p>
            </CardContent>
          </Card>
        </div>

        {/* OS Info */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Operating System</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{staticInfo.osName}</div>
              <p className="text-xs text-muted-foreground">
                {staticInfo.osVersion && `Version: ${staticInfo.osVersion}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Kernel</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate" title={staticInfo.kernelVersion}>
                {staticInfo.kernelVersion.length > 25
                  ? staticInfo.kernelVersion.substring(0, 25) + "..."
                  : staticInfo.kernelVersion}
              </div>
              <p className="text-xs text-muted-foreground">{staticInfo.platform}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Live Statistics</h2>
        <LiveStats totalMemoryGB={staticInfo.totalMemoryGB} totalDiskGB={staticInfo.totalDiskGB} />
      </div>
    </div>
  );
}
