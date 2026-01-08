import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import postgres from "postgres";

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

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Create a separate postgres client for migrations with max: 1
  // This is required for safe migration execution with postgres-js
  const migrationsClient = postgres(process.env.DATABASE_URL, {
    max: 1,
  });
  const db = drizzle(migrationsClient);

  try {
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "./app/db/migrations"),
    });
    console.log(`Migrations complete`);
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await migrationsClient.end();
  }
}

main().catch((error) => {
  console.error("Migration script failed:", error);
  process.exit(1);
});
