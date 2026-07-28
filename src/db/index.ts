import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Whether the database is wired up. Pages check this to show a friendly
// "finish setup" notice instead of crashing when DATABASE_URL is missing.
export const isDbConfigured = Boolean(connectionString);

// Instantiate lazily so importing this module never throws in a half-set-up
// environment (e.g. first `next dev` before `vercel env pull`).
export const db = connectionString
  ? drizzle(neon(connectionString), { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

export { schema };
