import { SystemInfo } from '../../components/systemInfo';
import { getSystemInfo } from '../api/stats/actions';

export default async function Home() {
  const systemInfo = await getSystemInfo();

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Raspberry Pi</h1>
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
