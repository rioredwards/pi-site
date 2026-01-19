import dotenv from "dotenv";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { Sql } from "postgres";

dotenv.config();

// Lazy initialization to avoid errors during Next.js build
// The DB client is only created when first accessed at runtime
let client: Sql | null = null;
let db: PostgresJsDatabase | null = null;

function getDatabaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return process.env.DATABASE_URL;
}

function initializeDb() {
  if (!db) {
    client = postgres(getDatabaseUrl());
    db = drizzle(client);
  }
}

export function getDb(): PostgresJsDatabase {
  initializeDb();
  return db!;
}

export function getClient(): Sql {
  initializeDb();
  return client!;
}
