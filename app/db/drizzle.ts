import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

dotenv.config();

// Use DATABASE_URL_EXTERNAL when running locally (outside Docker)
// Use DATABASE_URL when running inside Docker (points to 'db' service)
const databaseUrl = process.env.DATABASE_URL_EXTERNAL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DATABASE_URL_EXTERNAL environment variable is not set");
}

export const client = postgres(databaseUrl);
export const db = drizzle(client);
