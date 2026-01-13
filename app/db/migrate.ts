import dotenv from "dotenv";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { devLog } from "../../lib/utils";
import { client, db } from "./drizzle";

dotenv.config();

async function main() {
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "./app/db/migrations"),
  });
  devLog(`Migrations complete`);
  await client.end();
}

main();
