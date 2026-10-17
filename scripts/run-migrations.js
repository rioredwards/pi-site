#!/usr/bin/env node

const { drizzle } = require("drizzle-orm/postgres-js");
const { migrate } = require("drizzle-orm/postgres-js/migrator");
const postgres = require("postgres");
const path = require("path");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client);

(async () => {
  try {
    console.log("🔄 Running migrations...");
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "app/db/migrations"),
    });
    console.log("🔵 [run-migrations] migrations complete");
    console.log("✅ Migrations complete");
  } catch (error) {
    console.error("Migration failed. Check database connectivity and migration state.");
    process.exit(1);
  } finally {
    await client.end();
  }
})();
