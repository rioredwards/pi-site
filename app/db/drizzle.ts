import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Next.js automatically loads .env files, and Docker injects env vars in production
// So we don't need dotenv here - env vars should already be available

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client);
