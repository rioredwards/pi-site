import { getSystemDetails } from "@/lib/system";
import { SystemInfo } from '../../components/systemInfo';

export default async function Home() {
  const systemInfo = await getSystemDetails();

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Raspberry Pi</h1>
      <SystemInfo
        os={systemInfo.os}
        cpuTemp={systemInfo.cpuTemp}
        cpuUsage={systemInfo.cpuUsage}
        memoryUsage={systemInfo.memoryUsage}
      />
    </main>
  );
}
