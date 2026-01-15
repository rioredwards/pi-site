#!/usr/bin/env node

/**
 * Production migration script
 *
 * This runs Drizzle migrations without needing drizzle-kit.
 * It uses drizzle-orm's migrate() function which only needs:
 * - The migration SQL files
 * - A database connection
 */

const { drizzle } = require("drizzle-orm/postgres-js");
const { migrate } = require("drizzle-orm/postgres-js/migrator");
const postgres = require("postgres");
const path = require("path");

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log("🔄 Running database migrations...");

  // Create a connection specifically for migrations
  // max: 1 ensures we don't create unnecessary connections
  const migrationClient = postgres(databaseUrl, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    // Migrations folder path - works in both dev and Docker
    const migrationsPath = path.join(process.cwd(), "app/db/migrations");

    await migrate(db, { migrationsFolder: migrationsPath });

    console.log("✅ Migrations completed successfully");
  } catch (error) {
    // Check if it's a "relation already exists" error (db was created with db:push)
    if (error.message && error.message.includes("already exists")) {
      console.log("⚠️  Schema already exists (database may have been created with db:push)");
      console.log("   If this is a fresh deploy, consider wiping the database first.");
      console.log("   Continuing with app startup...");
    } else {
      console.error("❌ Migration failed:", error.message);
      process.exit(1);
    }
  } finally {
    await migrationClient.end();
  }
}

runMigrations();
