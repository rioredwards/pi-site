import { SystemInfo } from "../../components/systemInfo";
import { getSystemInfo } from "../api/stats/actions";

// Force dynamic rendering since stats are runtime data
export const dynamic = "force-dynamic";

export default async function Home() {
  const systemInfo = await getSystemInfo();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Raspberry Pi</h1>
      <SystemInfo
        hostname={systemInfo.hostname}
        platform={systemInfo.platform}
        architecture={systemInfo.architecture}
        cpuTemp={systemInfo.cpuTemp}
        cpuUsage={systemInfo.cpuUsage}
        memoryUsage={systemInfo.memoryUsage}
      />
    </main>
  );
}
