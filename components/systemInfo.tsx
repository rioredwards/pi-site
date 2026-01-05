import { SystemInfo as SystemInfoType } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

export function SystemInfo({
  hostname,
  platform,
  architecture,
  cpuTemp,
  cpuUsage,
  memoryUsage,
}: SystemInfoType) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>System Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {[
            ["Hostname", hostname],
            ["Platform", platform],
            ["Architecture", architecture],
            ["CPU Temperature", `${cpuTemp.toFixed(1)}°C`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}:</span>
              <span className="font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">CPU Usage</h3>
          {cpuUsage.map((usage, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Core {index}</span>
                <span>{usage}%</span>
              </div>
              <Progress value={parseFloat(usage)} className="h-2" />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Memory Usage
          </h3>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Used</span>
            <span>
              {memoryUsage.used.toFixed(2)} / {memoryUsage.total.toFixed(2)} GB
            </span>
          </div>
          <Progress
            value={(memoryUsage.used / memoryUsage.total) * 100}
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}
