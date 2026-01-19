import dotenv from "dotenv";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { devLog } from "@/app/lib/utils";
import { getClient, getDb } from "./drizzle";

dotenv.config();

async function main() {
  await migrate(getDb(), {
    migrationsFolder: path.join(process.cwd(), "./app/db/migrations"),
  });
  devLog(`Migrations complete`);
  await getClient().end();
}

main();
