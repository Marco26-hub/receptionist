import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL non configurata");
  }

  client ??= postgres(process.env.DATABASE_URL, {
    max: 5,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, { schema });
}
