import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";

// dotenv is optional - Docker provides env vars directly
// In production, env vars are injected by Docker, so dotenv isn't needed
async function loadEnv() {
  try {
    const dotenv = await import("dotenv");
    dotenv.default.config();
  } catch {
    // dotenv not available, assume env vars are provided by Docker
  }
}

async function main() {
  await loadEnv();

  // Import after env is loaded
  const { client, db } = await import("./drizzle");

  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "./app/db/migrations"),
  });
  console.log(`Migrations complete`);
  await client.end();
}

main();
